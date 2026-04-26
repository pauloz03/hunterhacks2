import csv
import json
import os
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv


TARGET_NEIGHBORHOODS = {
    "jackson heights": {"borough": "queens"},
    "flushing": {"borough": "queens"},
    "harlem": {"borough": "manhattan"},
    "washington heights": {"borough": "manhattan"},
    "chinatown": {"borough": "manhattan"},
    "inwood": {"borough": "manhattan"},
    "lower east side": {"borough": "manhattan"},
    "east harlem": {"borough": "manhattan"},
    "sunset park": {"borough": "brooklyn"},
    "bushwick": {"borough": "brooklyn"},
    "crown heights": {"borough": "brooklyn"},
    "bedford-stuyvesant": {"borough": "brooklyn"},
    "flatbush": {"borough": "brooklyn"},
    "east new york": {"borough": "brooklyn"},
    "mott haven": {"borough": "bronx"},
    "fordham": {"borough": "bronx"},
    "tremont": {"borough": "bronx"},
    "belmont": {"borough": "bronx"},
    "kingsbridge": {"borough": "bronx"},
    "south bronx": {"borough": "bronx"},
    "st george": {"borough": "staten island"},
    "st. george": {"borough": "staten island"},
    "port richmond": {"borough": "staten island"},
    "new brighton": {"borough": "staten island"},
    "stapleton": {"borough": "staten island"},
    "tompkinsville": {"borough": "staten island"},
    "mariners harbor": {"borough": "staten island"},
}

# Working NYC Open Data endpoints (verified via curl).
NYC_COMMUNITY_ORGS_URL = "https://data.cityofnewyork.us/resource/i4kb-6ab6.json"
NYC_HOMEBASE_URL = "https://data.cityofnewyork.us/resource/ntcm-2w4k.json"
NYC_SHELTERS_URL = "https://data.cityofnewyork.us/resource/ntcm-2v4f.json"

NEIGHBORHOOD_QUERY_TERMS = [
    "food pantry",
    "free clinic",
    "community health center",
    "immigrant services",
    "legal aid",
    "mutual aid",
    "community center",
    "affordable housing",
    "emergency shelter",
    "homeless shelter",
]


BOROUGH_BOOST_QUERIES = [
    "food pantry {borough} NYC",
    "free clinic {borough} NYC",
    "immigrant services {borough} NYC",
    "legal aid {borough} NYC",
    "affordable housing {borough} NYC",
    "emergency shelter {borough} NYC",
    "homeless shelter {borough} NYC",
]


def _titleize_neighborhood(value: str) -> str:
    if value.lower() in {"st george", "st. george"}:
        return "St. George"
    return " ".join(part.capitalize() for part in value.split())


def build_google_queries() -> List[str]:
    queries: List[str] = []
    seen: Set[str] = set()

    for neighborhood, meta in TARGET_NEIGHBORHOODS.items():
        borough = (meta.get("borough") or "").title()
        display = _titleize_neighborhood(neighborhood)
        for term in NEIGHBORHOOD_QUERY_TERMS:
            q = f"{term} {display} {borough} NYC".strip()
            key = q.lower()
            if key not in seen:
                seen.add(key)
                queries.append(q)

    # Extra borough-level searches (non-Queens) to reduce Queens-heavy skew.
    for borough in ["Manhattan", "Brooklyn", "Bronx", "Staten Island"]:
        for template in BOROUGH_BOOST_QUERIES:
            q = template.format(borough=borough)
            key = q.lower()
            if key not in seen:
                seen.add(key)
                queries.append(q)

    return queries


GOOGLE_QUERIES = build_google_queries()

CSV_COLUMNS = [
    "name",
    "category",
    "address",
    "borough",
    "neighborhood",
    "latitude",
    "longitude",
    "phone",
    "website",
    "hours",
    "is_free",
    "description",
]


def fetch_json_get(url: str, params: Optional[Dict[str, str]] = None) -> object:
    full_url = url
    if params:
        full_url = f"{url}?{urlencode(params)}"
    try:
        with urlopen(full_url, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"[warn] failed request: {full_url} -> {exc}")
        return []


def fetch_json_post(url: str, payload: Dict, headers: Dict[str, str]) -> object:
    data = json.dumps(payload).encode("utf-8")
    request = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"[warn] failed POST request: {url} -> {exc}")
        return {}


def first_nonempty(data: Dict, keys: Iterable[str]) -> str:
    for key in keys:
        val = data.get(key)
        if val is None:
            continue
        if isinstance(val, str):
            cleaned = val.strip()
            if cleaned:
                return cleaned
        elif isinstance(val, (int, float)):
            return str(val)
        elif isinstance(val, dict):
            if "url" in val and val["url"]:
                return str(val["url"])
            return json.dumps(val)
    return ""


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def normalize_borough(text: str) -> str:
    t = normalize_space(text).lower()
    if not t:
        return ""
    aliases = {
        "mn": "manhattan",
        "bx": "bronx",
        "bk": "brooklyn",
        "qn": "queens",
        "si": "staten island",
    }
    return aliases.get(t, t)


def infer_target_neighborhood(address: str, neighborhood: str, borough: str) -> Tuple[str, str]:
    haystack = " ".join([address.lower(), neighborhood.lower(), borough.lower()])
    for n, meta in TARGET_NEIGHBORHOODS.items():
        if n in haystack:
            return n.title(), meta["borough"].title()

    if "queens" in haystack:
        if "jackson" in haystack and "heights" in haystack:
            return "Jackson Heights", "Queens"
        if "flushing" in haystack:
            return "Flushing", "Queens"
    if "brooklyn" in haystack and "sunset park" in haystack:
        return "Sunset Park", "Brooklyn"
    if "staten island" in haystack and ("st george" in haystack or "st. george" in haystack):
        return "St. George", "Staten Island"

    return "", borough.title() if borough else ""


def is_target_area(address: str, neighborhood: str, borough: str) -> bool:
    n, b = infer_target_neighborhood(address, neighborhood, borough)
    return bool(n and b)


def classify_category(default_category: str, name: str, description: str) -> str:
    text = f"{name} {description}".lower()
    if any(k in text for k in ["legal", "law", "attorney"]):
        return "legal"
    if "immigrant" in text or "immigration" in text:
        return "immigrant_services"
    if any(k in text for k in ["clinic", "health", "medical"]):
        return "health"
    if any(k in text for k in ["food pantry", "pantry", "soup kitchen", "meals"]):
        return "food"
    return default_category


def make_resource(
    *,
    name: str,
    category: str,
    address: str = "",
    borough: str = "",
    neighborhood: str = "",
    latitude: str = "",
    longitude: str = "",
    phone: str = "",
    website: str = "",
    hours: str = "",
    is_free: str = "",
    description: str = "",
) -> Dict[str, str]:
    return {
        "name": normalize_space(name),
        "category": category,
        "address": normalize_space(address),
        "borough": normalize_space(borough),
        "neighborhood": normalize_space(neighborhood),
        "latitude": latitude,
        "longitude": longitude,
        "phone": normalize_space(phone),
        "website": normalize_space(website),
        "hours": normalize_space(hours),
        "is_free": is_free,
        "description": normalize_space(description),
    }


def pull_nyc_community_orgs() -> List[Dict[str, str]]:
    rows = fetch_json_get(NYC_COMMUNITY_ORGS_URL, params={"$limit": "5000"})
    if not isinstance(rows, list):
        return []

    out: List[Dict[str, str]] = []
    for row in rows:
        name = first_nonempty(row, ["organization_name", "name"])
        address = first_nonempty(row, ["street_address", "address"])
        borough = normalize_borough(first_nonempty(row, ["borough"]))
        neighborhood = first_nonempty(row, ["nta", "neighborhood"])
        phone = first_nonempty(row, ["phone_number", "phone"])
        website = first_nonempty(row, ["website", "url"])
        description = first_nonempty(row, ["mission", "volunteer_program_description", "description"])
        latitude = first_nonempty(row, ["latitude"])
        longitude = first_nonempty(row, ["longitude"])

        if not name or not is_target_area(address, neighborhood, borough):
            continue

        nh, bor = infer_target_neighborhood(address, neighborhood, borough)
        category = classify_category("immigrant_services", name, description)
        out.append(
            make_resource(
                name=name,
                category=category,
                address=address,
                borough=bor or borough.title(),
                neighborhood=nh or neighborhood,
                latitude=latitude,
                longitude=longitude,
                phone=phone,
                website=website,
                hours="",
                is_free="unknown",
                description=description or "NYC Open Data: community organization.",
            )
        )
    return out


def pull_nyc_homebase() -> List[Dict[str, str]]:
    rows = fetch_json_get(NYC_HOMEBASE_URL, params={"$limit": "5000"})
    if not isinstance(rows, list):
        return []

    out: List[Dict[str, str]] = []
    for row in rows:
        name = first_nonempty(row, ["homebase_office", "name"])
        address = first_nonempty(row, ["address"])
        borough = normalize_borough(first_nonempty(row, ["borough"]))
        neighborhood = first_nonempty(row, ["nta", "neighborhood"])
        phone = first_nonempty(row, ["phone_number", "phone"])
        latitude = first_nonempty(row, ["latitude"])
        longitude = first_nonempty(row, ["longitude"])

        if not name or not is_target_area(address, neighborhood, borough):
            continue

        nh, bor = infer_target_neighborhood(address, neighborhood, borough)
        out.append(
            make_resource(
                name=f"Homebase - {name}",
                category="immigrant_services",
                address=address,
                borough=bor or borough.title(),
                neighborhood=nh or neighborhood,
                latitude=latitude,
                longitude=longitude,
                phone=phone,
                website="",
                hours="",
                is_free="true",
                description="NYC Open Data: Homebase prevention services location.",
            )
        )
    return out


def pull_nyc_shelters() -> List[Dict[str, str]]:
    rows = fetch_json_get(NYC_SHELTERS_URL, params={"$limit": "5000"})
    if not isinstance(rows, list):
        return []

    out: List[Dict[str, str]] = []
    for row in rows:
        name = first_nonempty(row, ["facility_name", "name", "provider"])
        address = first_nonempty(row, ["address", "street_address", "location_1_location"])
        borough = normalize_borough(first_nonempty(row, ["borough", "boro"]))
        neighborhood = first_nonempty(row, ["neighborhood", "nta"])
        phone = first_nonempty(row, ["phone", "phone_number"])
        latitude = first_nonempty(row, ["latitude"])
        longitude = first_nonempty(row, ["longitude"])

        if not name or not is_target_area(address, neighborhood, borough):
            continue

        nh, bor = infer_target_neighborhood(address, neighborhood, borough)
        out.append(
            make_resource(
                name=name,
                category="housing",
                address=address,
                borough=bor or borough.title(),
                neighborhood=nh or neighborhood,
                latitude=latitude,
                longitude=longitude,
                phone=phone,
                website="",
                hours="",
                is_free="unknown",
                description="NYC Open Data: shelter location.",
            )
        )
    return out


def category_from_query(query: str) -> str:
    q = query.lower()
    if "housing" in q or "shelter" in q:
        return "housing"
    if "legal" in q:
        return "legal-rights"
    if "community" in q or "mutual aid" in q:
        return "community"
    if "pantry" in q:
        return "food"
    if "clinic" in q:
        return "health"
    if "immigrant" in q:
        return "immigrant_services"
    return "immigrant_services"


def google_text_search_new(query: str, api_key: str) -> List[Dict]:
    endpoint = "https://places.googleapis.com/v1/places:searchText"
    payload = {"textQuery": query}
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(
            [
                "places.id",
                "places.displayName",
                "places.formattedAddress",
                "places.location",
                "places.nationalPhoneNumber",
                "places.websiteUri",
                "places.regularOpeningHours.weekdayDescriptions",
                "places.types",
            ]
        ),
    }
    resp = fetch_json_post(endpoint, payload, headers)
    if isinstance(resp, dict):
        status = resp.get("status")
        if status and status != "OK":
            print(f"[warn] google text search status={status} query={query}")
        return resp.get("places", []) or []
    return []


def infer_borough_from_address(address: str) -> str:
    a = (address or "").lower()
    if "queens" in a:
        return "queens"
    if "brooklyn" in a:
        return "brooklyn"
    if "manhattan" in a or "new york, ny" in a:
        return "manhattan"
    if "bronx" in a:
        return "bronx"
    if "staten island" in a:
        return "staten island"
    return ""


def pull_google_places(api_key: str) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    seen_place_ids: Set[str] = set()

    for query in GOOGLE_QUERIES:
        base_category = category_from_query(query)
        results = google_text_search_new(query, api_key)
        for item in results:
            place_id = item.get("id")
            if place_id and place_id in seen_place_ids:
                continue
            if place_id:
                seen_place_ids.add(place_id)

            display_name = (item.get("displayName") or {}).get("text", "")
            address = item.get("formattedAddress", "")
            location = item.get("location") or {}
            lat = str(location.get("latitude", "")) if location.get("latitude") is not None else ""
            lng = str(location.get("longitude", "")) if location.get("longitude") is not None else ""
            phone = item.get("nationalPhoneNumber", "")
            website = item.get("websiteUri", "")
            weekday = (item.get("regularOpeningHours") or {}).get("weekdayDescriptions", [])
            hours = "; ".join(weekday) if weekday else ""
            types = ", ".join(item.get("types", []))

            borough = infer_borough_from_address(address)
            neighborhood = ""
            if not is_target_area(address, neighborhood, borough):
                continue
            nh, bor = infer_target_neighborhood(address, neighborhood, borough)

            category = classify_category(base_category, display_name, f"{types} {query}")
            out.append(
                make_resource(
                    name=display_name,
                    category=category,
                    address=address,
                    borough=bor or borough.title(),
                    neighborhood=nh,
                    latitude=lat,
                    longitude=lng,
                    phone=phone,
                    website=website,
                    hours=hours,
                    is_free="unknown",
                    description=f"Google Places result for: {query}",
                )
            )
    return out


def dedupe_resources(resources: List[Dict[str, str]]) -> List[Dict[str, str]]:
    deduped: List[Dict[str, str]] = []
    seen: Set[Tuple[str, str]] = set()
    for r in resources:
        key = (
            normalize_space(r.get("name", "")).lower(),
            normalize_space(r.get("address", "")).lower(),
        )
        if not key[0] or not key[1]:
            continue
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)
    return deduped


def write_csv(resources: List[Dict[str, str]], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for r in resources:
            writer.writerow({k: r.get(k, "") for k in CSV_COLUMNS})


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(repo_root / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")

    google_api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    if not google_api_key:
        raise RuntimeError("Missing GOOGLE_PLACES_API_KEY in env.")

    print("[info] pulling NYC Open Data...")
    org_rows = pull_nyc_community_orgs()
    homebase_rows = pull_nyc_homebase()
    shelter_rows = pull_nyc_shelters()
    print(
        f"[info] NYC rows: community_orgs={len(org_rows)} homebase={len(homebase_rows)} shelters={len(shelter_rows)}"
    )

    print("[info] pulling Google Places API (New)...")
    google_rows = pull_google_places(google_api_key)
    print(f"[info] Google rows: {len(google_rows)}")

    all_rows = org_rows + homebase_rows + shelter_rows + google_rows
    deduped = dedupe_resources(all_rows)
    print(f"[info] total rows after dedupe: {len(deduped)}")

    out_file = Path(__file__).resolve().parent / "resources.csv"
    write_csv(deduped, out_file)
    print(f"[done] wrote {out_file}")


if __name__ == "__main__":
    main()
