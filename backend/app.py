import os
import json
import time
import uuid
from urllib import parse, request as urlrequest
from flask import Flask, request, jsonify
from supabase import create_client
from dotenv import load_dotenv
from rag import RagEngine

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = jsonify({})
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        return res, 200


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response


supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_key:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

supabase = create_client(supabase_url, supabase_service_key)
google_translate_api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY", "").strip()
translate_cache = {}
rag_engine = RagEngine(supabase)


@app.route("/")
def home():
    return "Flask backend is running!"


@app.route("/auth/signup", methods=["POST"])
def signup():
    body = request.get_json()
    email = (body or {}).get("email", "").strip()
    password = (body or {}).get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        response = supabase.auth.sign_up({"email": email, "password": password})
        user = response.user

        if user and user.id:
            supabase.table("users").upsert(
                {"id": user.id, "email": user.email},
                on_conflict="id",
            ).execute()

        return jsonify({
            "message": "Account created. Check your email for confirmation if required.",
            "user": {"id": user.id, "email": user.email} if user else None,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/auth/login", methods=["POST"])
def login():
    body = request.get_json()
    email = (body or {}).get("email", "").strip()
    password = (body or {}).get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        session = response.session

        persona_type = None
        display_name = None
        if response.user:
            try:
                profile = (
                    supabase.table("users")
                    .select("persona_type,display_name")
                    .eq("id", response.user.id)
                    .single()
                    .execute()
                )
                persona_type = (profile.data or {}).get("persona_type")
                display_name = (profile.data or {}).get("display_name")
            except Exception:
                # Backward compatibility for DBs that don't have display_name yet.
                profile = (
                    supabase.table("users")
                    .select("persona_type")
                    .eq("id", response.user.id)
                    .single()
                    .execute()
                )
                persona_type = (profile.data or {}).get("persona_type")

        return jsonify({
            "message": "Logged in successfully.",
            "access_token": session.access_token if session else None,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "persona_type": persona_type,
                "display_name": display_name,
            } if response.user else None,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.route("/users/profile", methods=["PATCH"])
def update_profile():
    body = request.get_json()
    user_id = (body or {}).get("user_id")
    language_code = (body or {}).get("language_code")
    persona_type = (body or {}).get("persona_type")
    display_name = (body or {}).get("display_name")

    if not user_id:
        return jsonify({"error": "user_id is required."}), 400

    try:
        updates = {}
        if language_code is not None:
            updates["language_code"] = language_code
        if persona_type is not None:
            updates["persona_type"] = persona_type
        include_display_name = display_name is not None
        if include_display_name:
            updates["display_name"] = display_name

        if not updates:
            return jsonify({"error": "No profile fields provided to update."}), 400

        try:
            supabase.table("users").update(updates).eq("id", user_id).execute()
        except Exception:
            # If display_name column doesn't exist yet, retry without it.
            if include_display_name:
                updates.pop("display_name", None)
                if not updates:
                    return jsonify({"message": "Profile updated."})
                supabase.table("users").update(updates).eq("id", user_id).execute()
            else:
                raise

        return jsonify({"message": "Profile updated."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/auth/logout", methods=["POST"])
def logout():
    body = request.get_json()
    user_id = (body or {}).get("user_id")

    try:
        if user_id:
            supabase.auth.admin.sign_out(user_id)
    except Exception:
        pass

    return jsonify({"message": "Logged out."}), 200


@app.route("/resources", methods=["GET"])
def get_resources():
    category = request.args.get("category", "").strip()

    try:
        query = (
            supabase.table("resources")
            .select("id,name,category,address,borough,latitude,longitude,phone,website,is_free")
            .not_.is_("latitude", "null")
            .not_.is_("longitude", "null")
        )
        if category and category != "all":
            query = query.eq("category", category)
        result = query.execute()
        return jsonify({"resources": result.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/resources/search", methods=["GET"])
def search_resources():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"results": []}), 200

    try:
        result = (
            supabase.table("resources")
            .select("id,name,category,address,latitude,longitude,phone,website,is_free")
            .or_(f"name.ilike.%{q}%,address.ilike.%{q}%")
            .not_.is_("latitude", "null")
            .not_.is_("longitude", "null")
            .limit(8)
            .execute()
        )
        return jsonify({"results": result.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/categories", methods=["GET"])
def get_categories():
    persona_type = request.args.get("persona_type", "").strip()

    if not persona_type:
        return jsonify({"error": "persona_type is required."}), 400

    try:
        result = supabase.table("guide_categories").select("*").contains("persona_types", [persona_type]).execute()
        return jsonify({"categories": result.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/users/saved", methods=["GET"])
def list_saved_resources():
    user_id = request.args.get("user_id", "").strip()
    if not user_id:
        return jsonify({"error": "user_id is required."}), 400

    try:
        saved = (
            supabase.table("saved_resources")
            .select("resource_id")
            .eq("user_id", user_id)
            .execute()
        )
        resource_ids = [row.get("resource_id") for row in (saved.data or []) if row.get("resource_id") is not None]

        if not resource_ids:
            return jsonify({"resources": []})

        resources = (
            supabase.table("resources")
            .select("id,name,category,address,borough,neighborhood,latitude,longitude,phone,website,is_free")
            .in_("id", resource_ids)
            .execute()
        )
        return jsonify({"resources": resources.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/users/saved", methods=["POST"])
def save_resource():
    body = request.get_json() or {}
    user_id = (body.get("user_id") or "").strip()
    resource_id = body.get("resource_id")

    if not user_id or resource_id is None:
        return jsonify({"error": "user_id and resource_id are required."}), 400

    try:
        supabase.table("saved_resources").upsert(
            {"user_id": user_id, "resource_id": resource_id},
            on_conflict="user_id,resource_id",
        ).execute()
        return jsonify({"message": "Saved resource."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/users/saved", methods=["DELETE"])
def unsave_resource():
    body = request.get_json() or {}
    user_id = (body.get("user_id") or "").strip()
    resource_id = body.get("resource_id")

    if not user_id or resource_id is None:
        return jsonify({"error": "user_id and resource_id are required."}), 400

    try:
        (
            supabase.table("saved_resources")
            .delete()
            .eq("user_id", user_id)
            .eq("resource_id", resource_id)
            .execute()
        )
        return jsonify({"message": "Removed saved resource."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def translate_text_internal(payload):
    if not google_translate_api_key:
        return {"translatedText": payload.get("text", ""), "translated": False, "error": "missing_google_translate_key"}

    text = payload.get("text")
    target = str(payload.get("target", "")).strip()
    source = str(payload.get("source", "")).strip()
    if not isinstance(text, str) or not text.strip() or not target:
        return {"translatedText": text or "", "translated": False, "error": "invalid_payload"}

    normalized_text = text.strip()
    cache_key = f"{source or 'auto'}|{target}|{normalized_text}"
    cached = translate_cache.get(cache_key)
    if cached is not None:
        return {
            "translatedText": cached["translatedText"],
            "detectedSource": cached.get("detectedSource"),
            "target": target,
            "translated": True,
            "cached": True,
        }

    data = {
        "q": normalized_text,
        "target": target,
        "format": "text",
    }
    if source:
        data["source"] = source

    endpoint = (
        "https://translation.googleapis.com/language/translate/v2"
        f"?key={parse.quote(google_translate_api_key)}"
    )
    req = urlrequest.Request(
        endpoint,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urlrequest.urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
            result = json.loads(raw)
    except Exception as exc:
        return {"translatedText": text, "translated": False, "error": f"translate_request_failed:{str(exc)}"}

    translated_items = (((result or {}).get("data") or {}).get("translations") or [])
    if not translated_items:
        return {"translatedText": text, "translated": False, "error": "no_translation_returned"}
    translated = translated_items[0].get("translatedText")
    detected_source = translated_items[0].get("detectedSourceLanguage")
    if not translated:
        return {"translatedText": text, "translated": False, "error": "translation_empty"}
    value = {"translatedText": translated, "detectedSource": detected_source}
    translate_cache[cache_key] = value
    return {
        "translatedText": translated,
        "detectedSource": detected_source,
        "target": target,
        "translated": True,
        "cached": False,
    }


@app.route("/rag/reindex", methods=["POST"])
def rag_reindex():
    request_id = str(uuid.uuid4())
    start = time.time()
    try:
        result = rag_engine.reindex()
        payload = {
            "request_id": request_id,
            "message": "RAG index rebuilt.",
            **result,
        }
        print(json.dumps({
            "event": "rag_reindex",
            "request_id": request_id,
            "elapsed_ms": int((time.time() - start) * 1000),
            "failure_category": None,
        }))
        return jsonify(payload)
    except Exception as exc:
        print(json.dumps({
            "event": "rag_reindex",
            "request_id": request_id,
            "elapsed_ms": int((time.time() - start) * 1000),
            "failure_category": "reindex_failed",
        }))
        return jsonify({"request_id": request_id, "error": str(exc)}), 500


@app.route("/rag/stats", methods=["GET"])
def rag_stats():
    request_id = str(uuid.uuid4())
    try:
        stats = rag_engine.rag_stats()
        return jsonify({"request_id": request_id, **stats})
    except Exception as exc:
        return jsonify({"request_id": request_id, "error": str(exc)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    request_id = str(uuid.uuid4())
    started = time.time()
    body = request.get_json(silent=True) or {}
    message = str(body.get("message", "")).strip()
    language_code = str(body.get("language_code", "")).strip() or "en"
    persona_type = str(body.get("persona_type", "")).strip() or None
    screen_context = body.get("screen_context") if isinstance(body.get("screen_context"), dict) else {}

    if not message:
        return jsonify({"request_id": request_id, "error": "message is required"}), 400

    try:
        response, logs = rag_engine.build_chat_response(
            query=message,
            language_code=language_code,
            persona_type=persona_type,
            screen_context=screen_context,
            translate_func=translate_text_internal,
            request_id=request_id,
        )
        print(json.dumps({
            "event": "chat",
            "request_id": request_id,
            "retrieval_candidate_count": logs.get("retrieval_candidate_count"),
            "top_chunk_ids": logs.get("top_chunk_ids"),
            "used_fallback": logs.get("used_fallback"),
            "retrieval_error": logs.get("retrieval_error"),
            "retrieval_latency_ms": logs.get("retrieval_latency_ms"),
            "model_latency_ms": logs.get("model_latency_ms"),
            "total_latency_ms": logs.get("total_latency_ms"),
            "failure_category": None,
        }))
        return jsonify(response)
    except Exception as exc:
        print(json.dumps({
            "event": "chat",
            "request_id": request_id,
            "total_latency_ms": int((time.time() - started) * 1000),
            "failure_category": "chat_failed",
        }))
        return jsonify({
            "request_id": request_id,
            "error": str(exc),
            "answer": "I ran into an issue while preparing a grounded response. Please try again.",
            "used_language": "en",
            "citations": [],
            "actions": [],
        }), 500


if __name__ == "__main__":
    app.run(debug=True)