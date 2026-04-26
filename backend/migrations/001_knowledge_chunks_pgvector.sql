-- Enable pgvector extension and create RAG chunk storage.
create extension if not exists vector;

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  chunk_key text not null unique,
  source text not null,
  source_section text,
  title text not null,
  content text not null,
  category text,
  personas text[],
  language text not null default 'en',
  urls jsonb,
  priority integer not null default 0,
  content_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_chunks_source on public.knowledge_chunks(source);
create index if not exists idx_knowledge_chunks_category on public.knowledge_chunks(category);
create index if not exists idx_knowledge_chunks_personas on public.knowledge_chunks using gin(personas);
create index if not exists idx_knowledge_chunks_content_hash on public.knowledge_chunks(content_hash);
create index if not exists idx_knowledge_chunks_embedding_ivfflat
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.touch_knowledge_chunks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_knowledge_chunks_updated_at on public.knowledge_chunks;
create trigger trg_knowledge_chunks_updated_at
before update on public.knowledge_chunks
for each row execute function public.touch_knowledge_chunks_updated_at();

-- RPC used by backend retrieval layer.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 24,
  filter_persona text default null,
  filter_category text default null,
  filter_language text default 'en'
)
returns table (
  id uuid,
  chunk_key text,
  source text,
  source_section text,
  title text,
  content text,
  category text,
  personas text[],
  urls jsonb,
  score double precision
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.chunk_key,
    kc.source,
    kc.source_section,
    kc.title,
    kc.content,
    kc.category,
    kc.personas,
    kc.urls,
    1 - (kc.embedding <=> query_embedding) as score
  from public.knowledge_chunks kc
  where kc.embedding is not null
    and (filter_language is null or kc.language = filter_language)
    and (filter_category is null or kc.category = filter_category)
    and (
      filter_persona is null
      or coalesce(array_length(kc.personas, 1), 0) = 0
      or 'all' = any(kc.personas)
      or filter_persona = any(kc.personas)
    )
  order by kc.embedding <=> query_embedding
  limit greatest(match_count, 1);
end;
$$;
