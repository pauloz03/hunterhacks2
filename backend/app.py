import os
from flask import Flask, request, jsonify
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = jsonify({})
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
        return res, 200


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
    return response


supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_key:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

supabase = create_client(supabase_url, supabase_service_key)


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
        if response.user:
            profile = supabase.table("users").select("persona_type").eq("id", response.user.id).single().execute()
            persona_type = (profile.data or {}).get("persona_type")

        return jsonify({
            "message": "Logged in successfully.",
            "access_token": session.access_token if session else None,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "persona_type": persona_type,
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

    if not user_id:
        return jsonify({"error": "user_id is required."}), 400

    try:
        supabase.table("users").update(
            {"language_code": language_code, "persona_type": persona_type}
        ).eq("id", user_id).execute()

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


if __name__ == "__main__":
    app.run(debug=True)
