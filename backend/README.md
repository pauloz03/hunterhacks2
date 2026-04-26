# Backend RAG Chatbot (Claude + Supabase pgvector)

This backend now supports a grounded chatbot with:

- `POST /rag/reindex` to ingest and embed knowledge chunks.
- `GET /rag/stats` to inspect chunk counts by source and category.
- `POST /chat` to answer user questions with citations + app actions.

Retrieval is **pgvector-first** using Supabase RPC `match_knowledge_chunks`.  
There is a clearly marked temporary fallback retriever when pgvector is unavailable (`RAG_ALLOW_FALLBACK=1`), intended for local resilience only.

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (default: `claude-3-5-sonnet-latest`)
- `EMBEDDING_PROVIDER` (default: `openai`)
- `EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- `OPENAI_API_KEY` (required when `EMBEDDING_PROVIDER=openai`)
- `GOOGLE_TRANSLATE_API_KEY` (for final answer translation to selected language)
- `RAG_TOP_K` (default: `8`)
- `RAG_CANDIDATES` (default: `24`)
- `RAG_RESOURCES_MARKDOWN_PATH` (optional override)
- `RAG_ALLOW_FALLBACK` (default: `1`)
- `RAG_DEBUG` (default: `0`)

## Database Migration (pgvector)

Run SQL migration:

- `backend/migrations/001_knowledge_chunks_pgvector.sql`

This migration creates:

- `knowledge_chunks` table
- vector index for similarity search
- metadata indexes (`source`, `category`, `personas`)
- RPC function: `match_knowledge_chunks(...)`

## Reindexing

```bash
curl -X POST "http://127.0.0.1:5000/rag/reindex"
```

Example response:

```json
{
  "request_id": "6f8186f4-ecc4-4d65-a2f1-92ce4efc53a1",
  "message": "RAG index rebuilt.",
  "raw_chunks": 210,
  "deduped_chunks": 181,
  "upserted": 181,
  "elapsed_ms": 63412,
  "resources_markdown_path": "/Users/.../landed_resources.md",
  "fallback_cache_ready": true
}
```

## Chat API

```bash
curl -X POST "http://127.0.0.1:5000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I get low-cost healthcare in NYC?",
    "language_code": "es",
    "persona_type": "immigrant",
    "screen_context": {"screen":"ask"}
  }'
```

Example response:

```json
{
  "answer": "Puedes inscribirte en NYC Care ...",
  "used_language": "es",
  "citations": [
    {
      "id": "f6f7f83d-...",
      "title": "Health — Finding a Doctor > NYC Care — Free/Low-Cost Health Program",
      "source": "landed_resources",
      "snippet": "NYC Care gives you access to your own doctor ...",
      "url": "https://www.nyccare.nyc/"
    }
  ],
  "actions": [
    {"type":"open_category","label":"Open health guide","route":"/category/health","params":{}},
    {"type":"open_map","label":"Open resource map","route":"/map","params":{}}
  ]
}
```

## Manual Verification Checklist

1. Run migration SQL in Supabase.
2. Start backend and run `POST /rag/reindex`.
3. Verify `GET /rag/stats` returns source/category counts.
4. Ask 5-10 questions via `POST /chat`:
   - transit, health, food, legal, housing.
5. Verify response contains:
   - non-empty `answer`
   - `citations[]` with source/snippet
   - safe `actions[]`
6. Test one non-English `language_code` (e.g. `es`, `ur`) for translated final output.

## Validation Script

Use:

```bash
python backend/rag_validation.py
```

It checks:

- `/rag/reindex` idempotent shape
- `/rag/stats` basic structure
- `/chat` response contract (`answer`, `citations`, `actions`, `used_language`)
