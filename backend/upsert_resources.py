import csv
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


def parse_bool(value: str):
    v = (value or "").strip().lower()
    if v in {"true", "1", "yes"}:
        return True
    if v in {"false", "0", "no"}:
        return False
    return None


def parse_float(value: str):
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def normalize_category(value: str) -> str:
    raw = (value or "").strip().lower()
    if raw == "immigrant_services":
        return "community"
    if raw == "legal":
        return "legal-rights"
    return raw


def load_rows(csv_path: Path):
    rows = []
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append(
                {
                    "name": (row.get("name") or "").strip(),
                    "category": normalize_category(row.get("category") or ""),
                    "address": (row.get("address") or "").strip(),
                    "borough": (row.get("borough") or "").strip(),
                    "latitude": parse_float(row.get("latitude") or ""),
                    "longitude": parse_float(row.get("longitude") or ""),
                    "phone": (row.get("phone") or "").strip(),
                    "website": (row.get("website") or "").strip(),
                    "is_free": parse_bool(row.get("is_free") or ""),
                }
            )
    return rows


def main():
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(repo_root / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_service_key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.")

    csv_path = Path(__file__).resolve().parent / "resources.csv"
    if not csv_path.exists():
        raise RuntimeError(f"CSV not found: {csv_path}")

    rows = load_rows(csv_path)
    if not rows:
        print("[warn] CSV is empty. No changes applied.")
        return

    supabase = create_client(supabase_url, supabase_service_key)

    print(f"[info] replacing resources table with {len(rows)} rows from CSV...")
    supabase.table("resources").delete().not_.is_("id", "null").execute()

    batch_size = 200
    inserted = 0
    for idx in range(0, len(rows), batch_size):
        chunk = rows[idx : idx + batch_size]
        supabase.table("resources").insert(chunk).execute()
        inserted += len(chunk)

    print(f"[done] inserted {inserted} rows into resources table.")


if __name__ == "__main__":
    main()
