import json
from urllib import request as urlrequest


BASE = "http://127.0.0.1:5000"


def call_json(method, path, payload=None):
    req = urlrequest.Request(
        f"{BASE}{path}",
        method=method,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
    )
    with urlrequest.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def assert_keys(data, keys, label):
    missing = [key for key in keys if key not in data]
    if missing:
        raise AssertionError(f"{label} missing keys: {missing}")


def main():
    reindex = call_json("POST", "/rag/reindex", {})
    assert_keys(reindex, ["request_id", "raw_chunks", "deduped_chunks", "upserted"], "reindex")

    stats = call_json("GET", "/rag/stats")
    assert_keys(stats, ["request_id", "total_chunks"], "stats")

    chat = call_json(
        "POST",
        "/chat",
        {
            "message": "Where can I get free or low cost health care in NYC?",
            "language_code": "en",
            "persona_type": "immigrant",
            "screen_context": {"screen": "ask"},
        },
    )
    assert_keys(chat, ["answer", "used_language", "citations", "actions"], "chat")
    if not isinstance(chat.get("citations"), list):
        raise AssertionError("chat.citations should be an array")
    if not isinstance(chat.get("actions"), list):
        raise AssertionError("chat.actions should be an array")
    print("RAG validation checks passed.")


if __name__ == "__main__":
    main()
