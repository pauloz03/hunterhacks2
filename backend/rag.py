import hashlib
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

from anthropic import Anthropic


DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6"
DEFAULT_EMBEDDING_PROVIDER = "openai"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_EMBEDDING_DIM = 1536
DEFAULT_RAG_TOP_K = 4
DEFAULT_RAG_CANDIDATES = 12

PRIORITY_BY_SOURCE = {
    "landed_resources": 200,
    "guideData": 120,
    "resources_table": 80,
}

CATEGORY_ROUTE_MAP = {
    "transit": "transit",
    "health": "health",
    "food": "food",
    "school": "school",
    "legal": "legal-rights",
    "housing": "housing",
    "banking": "banking",
    "work": "work",
    "community": "community",
    "emergency": "emergency",
}

HOTLINE_PATTERN = re.compile(r"(?:(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|(?:\b\d{3}\b))")
URL_PATTERN = re.compile(r"https?://[^\s)]+", re.IGNORECASE)


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).lower()


def _hash_text(value: str) -> str:
    return hashlib.sha256(_normalize_text(value).encode("utf-8")).hexdigest()


def _slugify(value: str) -> str:
    lowered = (value or "").strip().lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return re.sub(r"-{2,}", "-", lowered).strip("-")


def _safe_json_response(resp):
    raw = resp.read().decode("utf-8")
    return json.loads(raw)


def _extract_urls(text: str) -> list[str]:
    return sorted(set(URL_PATTERN.findall(text or "")))


def _dedupe_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_hash: dict[str, dict[str, Any]] = {}
    for chunk in chunks:
        content_hash = chunk["content_hash"]
        current = by_hash.get(content_hash)
        if not current:
            by_hash[content_hash] = chunk
            continue
        current_priority = int(current.get("priority", 0))
        next_priority = int(chunk.get("priority", 0))
        if next_priority > current_priority:
            chunk["metadata"]["duplicate_sources"] = sorted(
                set((chunk.get("metadata", {}).get("duplicate_sources") or []) + [current["source"]])
            )
            by_hash[content_hash] = chunk
        else:
            current["metadata"]["duplicate_sources"] = sorted(
                set((current.get("metadata", {}).get("duplicate_sources") or []) + [chunk["source"]])
            )
    return list(by_hash.values())


def _to_vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{float(v):.8f}" for v in values) + "]"


@dataclass
class RagConfig:
    anthropic_api_key: str
    anthropic_model: str
    embedding_provider: str
    embedding_model: str
    openai_api_key: str
    rag_top_k: int
    rag_candidates: int
    resources_markdown_path: str
    fallback_enabled: bool
    debug_enabled: bool
    model_max_tokens: int

    @classmethod
    def from_env(cls):
        project_root = Path(__file__).resolve().parent.parent
        fallback_markdown = project_root / "landed_resources.md"
        downloads_markdown = Path.home() / "Downloads" / "landed_resources.md"
        explicit_path = os.getenv("RAG_RESOURCES_MARKDOWN_PATH", "").strip()
        if explicit_path:
            resources_path = explicit_path
        elif fallback_markdown.exists():
            resources_path = str(fallback_markdown)
        else:
            resources_path = str(downloads_markdown)

        return cls(
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", "").strip(),
            anthropic_model=os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL).strip(),
            embedding_provider=os.getenv("EMBEDDING_PROVIDER", DEFAULT_EMBEDDING_PROVIDER).strip().lower(),
            embedding_model=os.getenv("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL).strip(),
            openai_api_key=os.getenv("OPENAI_API_KEY", "").strip(),
            rag_top_k=max(1, int(os.getenv("RAG_TOP_K", DEFAULT_RAG_TOP_K))),
            rag_candidates=max(4, int(os.getenv("RAG_CANDIDATES", DEFAULT_RAG_CANDIDATES))),
            resources_markdown_path=resources_path,
            fallback_enabled=os.getenv("RAG_ALLOW_FALLBACK", "1").strip() != "0",
            debug_enabled=os.getenv("RAG_DEBUG", "0").strip() == "1",
            model_max_tokens=max(180, int(os.getenv("CHAT_MODEL_MAX_TOKENS", "380"))),
        )


class RagEngine:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.config = RagConfig.from_env()
        self._fallback_chunks: list[dict[str, Any]] = []
        self._fallback_vectors: dict[str, list[float]] = {}
        self._anthropic_client = Anthropic(api_key=self.config.anthropic_api_key) if self.config.anthropic_api_key else None

    @staticmethod
    def _cleanup_answer_text(raw_text: str) -> str:
        text = (raw_text or "").strip()
        if not text:
            return "I could not find a grounded answer yet. Try adding more detail so I can narrow it down."
        # Keep markdown syntax so the frontend can render headings/lists/links.
        text = re.sub(r"\s+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def _build_answer_short(text: str, max_len: int = 340) -> str:
        compact = re.sub(r"\s+", " ", (text or "").strip())
        if len(compact) <= max_len:
            return compact
        cutoff = compact[: max_len - 1]
        if " " in cutoff:
            cutoff = cutoff.rsplit(" ", 1)[0]
        return cutoff.rstrip(".,;: ") + "..."

    @staticmethod
    def _clean_citation_snippet(raw_text: str, max_len: int = 190) -> str:
        lines = []
        for line in (raw_text or "").splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            lowered = stripped.lower()
            # Drop metadata scaffolding from markdown chunks.
            if lowered.startswith("**category:**") or lowered.startswith("**personas:**") or lowered.startswith("**is_free:**"):
                continue
            cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", stripped)
            lines.append(cleaned)
        compact = " ".join(lines)
        compact = re.sub(r"\s+", " ", compact).strip()
        if len(compact) <= max_len:
            return compact
        cutoff = compact[: max_len - 1]
        if " " in cutoff:
            cutoff = cutoff.rsplit(" ", 1)[0]
        return cutoff.rstrip(".,;: ") + "..."

    def _embed_text(self, text: str) -> list[float]:
        if self.config.embedding_provider != "openai":
            raise RuntimeError(f"Unsupported EMBEDDING_PROVIDER: {self.config.embedding_provider}")
        if not self.config.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for embeddings when EMBEDDING_PROVIDER=openai")

        endpoint = "https://api.openai.com/v1/embeddings"
        payload = {
            "input": text,
            "model": self.config.embedding_model,
        }
        req = urlrequest.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.config.openai_api_key}",
            },
            method="POST",
        )
        try:
            with urlrequest.urlopen(req, timeout=20) as resp:
                data = _safe_json_response(resp)
        except urlerror.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Embedding API HTTP error: {exc.code} {body}") from exc
        except Exception as exc:
            raise RuntimeError(f"Embedding API failed: {exc}") from exc

        items = data.get("data") or []
        if not items or not items[0].get("embedding"):
            raise RuntimeError("Embedding API returned no embedding.")
        return items[0]["embedding"]

    def _parse_guide_data(self) -> list[dict[str, Any]]:
        guide_path = Path(__file__).resolve().parent.parent / "my-app" / "src" / "screens" / "guideData.json"
        if not guide_path.exists():
            return []
        content = json.loads(guide_path.read_text(encoding="utf-8"))
        categories = content.get("categories") or []
        chunks: list[dict[str, Any]] = []
        for category in categories:
            category_slug = CATEGORY_ROUTE_MAP.get(category.get("id")) or _slugify(category.get("id") or "")
            for topic in category.get("topics") or []:
                title = (topic.get("title") or "").strip()
                steps = topic.get("steps") or []
                lines = [title]
                if topic.get("readTime"):
                    lines.append(f"Read time: {topic.get('readTime')}")
                for idx, step in enumerate(steps, start=1):
                    lines.append(f"Step {idx}: {step.get('title', '').strip()} - {step.get('detail', '').strip()}")
                if topic.get("tip"):
                    lines.append(f"Tip: {topic.get('tip').strip()}")
                tags = topic.get("tags") or []
                if tags:
                    lines.append("Tags: " + ", ".join(tags))
                body = "\n".join([line for line in lines if line])
                personas = ["all"]
                source_section = f"{category.get('title', '').strip()} > {title}"
                chunk_key = f"guideData::{_slugify(category.get('id', 'unknown'))}::{_slugify(topic.get('id', title))}"
                chunks.append(
                    {
                        "chunk_key": chunk_key,
                        "source": "guideData",
                        "source_section": source_section,
                        "title": title,
                        "content": body,
                        "category": category_slug or None,
                        "personas": personas,
                        "language": "en",
                        "urls": _extract_urls(body),
                        "priority": PRIORITY_BY_SOURCE["guideData"],
                        "content_hash": _hash_text(body),
                        "metadata": {
                            "category_id": category.get("id"),
                            "category_title": category.get("title"),
                            "topic_id": topic.get("id"),
                            "read_time": topic.get("readTime"),
                            "tags": tags,
                        },
                    }
                )
        return chunks

    def _parse_markdown_chunks(self) -> list[dict[str, Any]]:
        path = Path(self.config.resources_markdown_path)
        if not path.exists():
            return []
        text = path.read_text(encoding="utf-8")
        sections = re.split(r"^##\s+CHUNK:\s+", text, flags=re.MULTILINE)
        chunks: list[dict[str, Any]] = []
        for block in sections[1:]:
            title_line, _, rest = block.partition("\n")
            chunk_title = title_line.strip()
            subparts = re.split(r"^###\s+", rest, flags=re.MULTILINE)
            head = subparts[0].strip()
            if head:
                subparts_to_process = [("Overview", head)]
            else:
                subparts_to_process = []
            for part in subparts[1:]:
                sub_title, _, sub_body = part.partition("\n")
                subparts_to_process.append((sub_title.strip(), sub_body.strip()))

            for sub_title, sub_body in subparts_to_process:
                if not sub_body:
                    continue
                section_title = f"{chunk_title} > {sub_title}" if sub_title and sub_title != "Overview" else chunk_title
                category_match = re.search(r"\*\*category:\*\*\s*([^\n]+)", sub_body, flags=re.IGNORECASE)
                personas_match = re.search(r"\*\*personas:\*\*\s*([^\n]+)", sub_body, flags=re.IGNORECASE)
                category = (category_match.group(1).strip().lower() if category_match else None)
                if category in CATEGORY_ROUTE_MAP:
                    category = CATEGORY_ROUTE_MAP[category]
                personas_raw = personas_match.group(1).strip().lower() if personas_match else "all"
                personas = [p.strip() for p in re.split(r"[,\|]", personas_raw) if p.strip()] or ["all"]
                content = sub_body.strip()
                chunk_key = f"landed_resources::{_slugify(section_title)}::{_hash_text(content)[:12]}"
                chunks.append(
                    {
                        "chunk_key": chunk_key,
                        "source": "landed_resources",
                        "source_section": section_title,
                        "title": section_title,
                        "content": content,
                        "category": category,
                        "personas": personas,
                        "language": "en",
                        "urls": _extract_urls(content),
                        "priority": PRIORITY_BY_SOURCE["landed_resources"],
                        "content_hash": _hash_text(content),
                        "metadata": {
                            "chunk_title": chunk_title,
                            "sub_title": sub_title,
                            "source_path": str(path),
                        },
                    }
                )
        return chunks

    def _parse_resources_table(self) -> list[dict[str, Any]]:
        chunks: list[dict[str, Any]] = []
        try:
            result = (
                self.supabase.table("resources")
                .select("id,name,category,address,borough,phone,website,is_free")
                .limit(500)
                .execute()
            )
        except Exception:
            return chunks
        for row in result.data or []:
            name = (row.get("name") or "").strip()
            category = (row.get("category") or "").strip().lower() or None
            lines = [name]
            if row.get("address"):
                lines.append(f"Address: {row.get('address')}")
            if row.get("borough"):
                lines.append(f"Borough: {row.get('borough')}")
            if row.get("phone"):
                lines.append(f"Phone: {row.get('phone')}")
            if row.get("website"):
                lines.append(f"Website: {row.get('website')}")
            if row.get("is_free") is not None:
                lines.append(f"Free: {'yes' if row.get('is_free') else 'no'}")
            content = "\n".join([line for line in lines if line])
            chunk_key = f"resources_table::{row.get('id')}"
            chunks.append(
                {
                    "chunk_key": chunk_key,
                    "source": "resources_table",
                    "source_section": "resources table",
                    "title": name or "Resource",
                    "content": content,
                    "category": category,
                    "personas": ["all"],
                    "language": "en",
                    "urls": _extract_urls(content),
                    "priority": PRIORITY_BY_SOURCE["resources_table"],
                    "content_hash": _hash_text(content),
                    "metadata": {"resource_id": row.get("id")},
                }
            )
        return chunks

    def _collect_raw_chunks(self) -> list[dict[str, Any]]:
        all_chunks = []
        all_chunks.extend(self._parse_guide_data())
        all_chunks.extend(self._parse_markdown_chunks())
        all_chunks.extend(self._parse_resources_table())
        return all_chunks

    def _upsert_chunks(self, chunks: list[dict[str, Any]]) -> dict[str, Any]:
        upserted = 0
        warmed_vectors: dict[str, list[float]] = {}
        for chunk in chunks:
            embedding = self._embed_text(chunk["content"])
            warmed_vectors[chunk["chunk_key"]] = embedding
            row = {
                **chunk,
                "embedding": _to_vector_literal(embedding),
            }
            self.supabase.table("knowledge_chunks").upsert(row, on_conflict="chunk_key").execute()
            upserted += 1
        return {"upserted": upserted, "fallback_vectors": warmed_vectors}

    def reindex(self) -> dict[str, Any]:
        started = time.time()
        raw_chunks = self._collect_raw_chunks()
        deduped = _dedupe_chunks(raw_chunks)
        result = self._upsert_chunks(deduped)
        self._fallback_chunks = deduped
        self._fallback_vectors = result.get("fallback_vectors") or {}
        return {
            "raw_chunks": len(raw_chunks),
            "deduped_chunks": len(deduped),
            "upserted": result["upserted"],
            "elapsed_ms": int((time.time() - started) * 1000),
            "resources_markdown_path": self.config.resources_markdown_path,
            "fallback_cache_ready": True,
        }

    def _fallback_retrieve(self, query: str, top_k: int, persona_type: str | None, category: str | None) -> list[dict[str, Any]]:
        if not self._fallback_chunks:
            self._fallback_chunks = _dedupe_chunks(self._collect_raw_chunks())
        query_embedding = self._embed_text(query)
        candidates = []
        qwords = set(re.findall(r"[a-z0-9]+", query.lower()))
        for chunk in self._fallback_chunks:
            if persona_type and persona_type != "all":
                personas = chunk.get("personas") or []
                if "all" not in personas and persona_type not in personas:
                    continue
            if category and chunk.get("category") and chunk.get("category") != category:
                continue
            emb = self._fallback_vectors.get(chunk["chunk_key"])
            if emb is None:
                emb = self._embed_text(chunk["content"])
                self._fallback_vectors[chunk["chunk_key"]] = emb
            dot = sum(a * b for a, b in zip(query_embedding, emb))
            keyword_bonus = 0.0
            content_l = chunk.get("content", "").lower()
            for word in qwords:
                if len(word) > 2 and word in content_l:
                    keyword_bonus += 0.02
            score = float(dot) + keyword_bonus
            candidates.append(
                {
                    "id": chunk["chunk_key"],
                    "title": chunk["title"],
                    "content": chunk["content"],
                    "source": chunk["source"],
                    "source_section": chunk["source_section"],
                    "category": chunk.get("category"),
                    "personas": chunk.get("personas"),
                    "urls": chunk.get("urls"),
                    "score": score,
                }
            )
        candidates.sort(key=lambda item: item["score"], reverse=True)
        return candidates[:top_k]

    def retrieve(
        self,
        query: str,
        persona_type: str | None = None,
        category: str | None = None,
        language: str | None = "en",
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        top_k = self.config.rag_top_k
        candidate_count = self.config.rag_candidates
        query_embedding = self._embed_text(query)
        query_vec = _to_vector_literal(query_embedding)
        used_fallback = False
        retrieval_error = None
        try:
            rpc = self.supabase.rpc(
                "match_knowledge_chunks",
                {
                    "query_embedding": query_vec,
                    "match_count": candidate_count,
                    "filter_persona": persona_type if persona_type else None,
                    "filter_category": category if category else None,
                    "filter_language": language if language else "en",
                },
            ).execute()
            candidates = rpc.data or []
        except Exception as exc:
            retrieval_error = str(exc)
            if not self.config.fallback_enabled:
                raise
            used_fallback = True
            candidates = self._fallback_retrieve(query, top_k=candidate_count, persona_type=persona_type, category=category)

        qwords = set(re.findall(r"[a-z0-9]+", query.lower()))
        reranked = []
        for row in candidates:
            score = float(row.get("score") or 0.0)
            content_l = str(row.get("content") or "").lower()
            keyword_bonus = 0.0
            for token in qwords:
                if token in {"snap", "moia", "311", "nyc", "care"} and token in content_l:
                    keyword_bonus += 0.03
                elif len(token) > 3 and token in content_l:
                    keyword_bonus += 0.005
            reranked.append({**row, "score": score + keyword_bonus})
        reranked.sort(key=lambda item: float(item.get("score", 0.0)), reverse=True)
        return reranked[:top_k], {
            "used_fallback": used_fallback,
            "candidate_count": len(candidates),
            "top_ids": [row.get("id") for row in reranked[:top_k]],
            "retrieval_error": retrieval_error,
        }

    def _build_prompt(self, query: str, persona_type: str | None, screen_context: dict[str, Any] | None, chunks: list[dict[str, Any]]) -> str:
        context_lines = []
        for idx, chunk in enumerate(chunks, start=1):
            snippet = (chunk.get("content") or "").strip()
            if len(snippet) > 650:
                snippet = snippet[:650] + "..."
            context_lines.append(
                f"[{idx}] source={chunk.get('source')} | title={chunk.get('title')} | section={chunk.get('source_section')}\n{snippet}"
            )
        context_block = "\n\n".join(context_lines) if context_lines else "No retrieved sources."
        persona = persona_type or "unknown"
        screen = json.dumps(screen_context or {}, ensure_ascii=False)
        return (
            "You are Landed Assistant, a grounded NYC newcomer support assistant.\n"
            "Rules:\n"
            "1) Only answer from provided context snippets.\n"
            "2) If context is insufficient, clearly say what is missing.\n"
            "3) Avoid definitive legal or medical claims; suggest official sources/hotlines when appropriate.\n"
            "4) Keep responses concise and action-oriented.\n"
            "5) Include reference indices in square brackets (e.g. [1], [2]) for factual claims.\n"
            "6) Return lightweight markdown: short headings, concise paragraphs, and at most 4 bullet points.\n"
            "7) Use plain, scannable formatting (no tables, no decorative emojis).\n\n"
            f"Persona: {persona}\n"
            f"Screen context: {screen}\n"
            f"User question: {query}\n\n"
            f"Retrieved context:\n{context_block}\n"
        )

    def _extract_actions(self, query: str, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        actions: list[dict[str, Any]] = []
        seen = set()
        combined = " ".join([(query or "").lower()] + [str(chunk.get("content") or "").lower() for chunk in chunks[:4]])

        category = None
        for key in ["transit", "health", "food", "school", "housing", "legal", "work", "banking", "community", "emergency"]:
            if key in combined:
                category = CATEGORY_ROUTE_MAP.get(key, key)
                break
        if category:
            route = f"/category/{category}"
            key = f"open_category:{route}"
            if key not in seen:
                actions.append({"type": "open_category", "label": f"Open {category.replace('-', ' ')} guide", "route": route, "params": {}})
                seen.add(key)

        if any(term in combined for term in ["near me", "map", "location", "nearby", "clinic", "pantry"]):
            key = "open_map:/map"
            if key not in seen:
                actions.append({"type": "open_map", "label": "Open resource map", "route": "/map", "params": {}})
                seen.add(key)

        for chunk in chunks:
            content = str(chunk.get("content") or "")
            urls = chunk.get("urls") or _extract_urls(content)
            for url in urls[:1]:
                key = f"open_resource_link:{url}"
                if key in seen:
                    continue
                actions.append({"type": "open_resource_link", "label": "Open official resource", "route": url, "params": {}})
                seen.add(key)
                break
            hotlines = HOTLINE_PATTERN.findall(content)
            if hotlines:
                phone = hotlines[0]
                key = f"call_hotline:{phone}"
                if key not in seen:
                    actions.append({"type": "call_hotline", "label": f"Call {phone}", "route": "", "params": {"phone": phone}})
                    seen.add(key)
            if len(actions) >= 4:
                break

        return actions[:4]

    def ask_claude(self, prompt: str) -> str:
        if not self._anthropic_client:
            raise RuntimeError("ANTHROPIC_API_KEY is missing.")
        message = self._anthropic_client.messages.create(
            model=self.config.anthropic_model,
            max_tokens=self.config.model_max_tokens,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}],
        )
        parts = []
        for item in message.content:
            if getattr(item, "type", "") == "text":
                parts.append(item.text)
        return "\n".join(parts).strip()

    def build_chat_response(
        self,
        query: str,
        language_code: str | None,
        persona_type: str | None,
        screen_context: dict[str, Any] | None,
        translate_func,
        request_id: str,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        total_start = time.time()
        retrieval_start = time.time()
        chunks, retrieval_meta = self.retrieve(query=query, persona_type=persona_type, category=None, language="en")
        retrieval_ms = int((time.time() - retrieval_start) * 1000)

        prompt = self._build_prompt(query=query, persona_type=persona_type, screen_context=screen_context, chunks=chunks)
        model_start = time.time()
        answer_en = self.ask_claude(prompt)
        model_ms = int((time.time() - model_start) * 1000)

        target_language = (language_code or "en").split("-")[0]
        answer = answer_en
        translated = False
        if target_language and target_language != "en":
            translated_result = translate_func({"text": answer_en, "target": target_language, "source": "en"})
            if translated_result and translated_result.get("translatedText"):
                answer = translated_result.get("translatedText")
                translated = bool(translated_result.get("translatedText") != answer_en)
        answer = self._cleanup_answer_text(answer)
        answer_short = self._build_answer_short(answer)

        citations = []
        for chunk in chunks[:5]:
            snippet = self._clean_citation_snippet(chunk.get("content") or "")
            url = (chunk.get("urls") or [None])[0]
            citations.append(
                {
                    "id": chunk.get("id") or chunk.get("chunk_key"),
                    "title": chunk.get("title") or "Source",
                    "source": chunk.get("source"),
                    "snippet": snippet,
                    "url": url,
                }
            )
        resource_cards = []
        for item in citations[:3]:
            resource_cards.append(
                {
                    "id": item.get("id"),
                    "title": item.get("title") or "Resource",
                    "snippet": item.get("snippet") or "",
                    "url": item.get("url"),
                    "source": item.get("source"),
                }
            )

        actions = self._extract_actions(query=query, chunks=chunks)
        total_ms = int((time.time() - total_start) * 1000)
        response = {
            "answer": answer,
            "answer_short": answer_short,
            "used_language": target_language or "en",
            "citations": citations,
            "resource_cards": resource_cards,
            "sources": citations,
            "actions": actions,
        }
        if self.config.debug_enabled:
            response["debug"] = {
                "request_id": request_id,
                "retrieval": retrieval_meta,
                "timing_ms": {
                    "retrieval": retrieval_ms,
                    "model": model_ms,
                    "total": total_ms,
                },
                "translated": translated,
            }

        logs = {
            "request_id": request_id,
            "retrieval_candidate_count": retrieval_meta.get("candidate_count"),
            "top_chunk_ids": retrieval_meta.get("top_ids"),
            "used_fallback": retrieval_meta.get("used_fallback"),
            "retrieval_error": retrieval_meta.get("retrieval_error"),
            "retrieval_latency_ms": retrieval_ms,
            "model_latency_ms": model_ms,
            "total_latency_ms": total_ms,
            "failure_category": None,
        }
        return response, logs

    def rag_stats(self) -> dict[str, Any]:
        summary = {"total_chunks": 0, "by_source": {}, "by_category": {}}
        try:
            rows = self.supabase.table("knowledge_chunks").select("source,category", count="exact").limit(2000).execute()
            data = rows.data or []
            summary["total_chunks"] = len(data)
            by_source = {}
            by_category = {}
            for row in data:
                src = row.get("source") or "unknown"
                cat = row.get("category") or "uncategorized"
                by_source[src] = by_source.get(src, 0) + 1
                by_category[cat] = by_category.get(cat, 0) + 1
            summary["by_source"] = by_source
            summary["by_category"] = by_category
            summary["fallback_enabled"] = self.config.fallback_enabled
            summary["resources_markdown_path"] = self.config.resources_markdown_path
            return summary
        except Exception:
            summary["fallback_note"] = "knowledge_chunks table unavailable; run /rag/reindex after migrations."
            return summary
