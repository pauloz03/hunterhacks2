# Supabase Reference Pack

This file is a practical, local reference for the main Supabase concepts and APIs used in this app.
It captures the most important implementation guidance and links to the canonical docs for full detail.

## Canonical docs (start here)

- Getting started (React quickstart): https://docs.supabase.com/docs/guides/getting-started/quickstarts/reactjs
- API keys: https://supabase.com/docs/guides/api/api-keys
- JavaScript reference: https://supabase.com/docs/reference/javascript/insert
- Auth guides: https://supabase.com/docs/guides/auth
- Database/API guides: https://supabase.com/docs/guides/api
- Realtime quickstart: https://supabase.com/docs/guides/realtime/getting_started
- Storage guides: https://supabase.com/docs/guides/storage
- Edge Functions quickstart: https://supabase.com/docs/guides/functions/quickstart
- CLI reference: https://supabase.com/docs/reference/cli

## Project connection essentials

Every Supabase project uses:

- Project URL: `https://<project-ref>.supabase.co`
- Client-safe key: publishable key (`sb_publishable_...`) or legacy `anon`

For frontend apps:

- Use only publishable/anon key in browser code.
- Never expose `service_role` or secret keys in client code.

Minimal client setup:

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

## Environment variable pattern (Vite)

Use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or publishable key if named differently in your team conventions)

All frontend-exposed env vars must start with `VITE_`.

## Core database operations (`supabase-js`)

Select:

```ts
const { data, error } = await supabase
  .from("todos")
  .select("*")
  .order("created_at", { ascending: false });
```

Insert:

```ts
const { data, error } = await supabase
  .from("todos")
  .insert({ title: "Learn Supabase" })
  .select();
```

Update:

```ts
const { data, error } = await supabase
  .from("todos")
  .update({ completed: true })
  .eq("id", 1)
  .select();
```

Delete:

```ts
const { error } = await supabase.from("todos").delete().eq("id", 1);
```

RPC:

```ts
const { data, error } = await supabase.rpc("hello_world");
```

## Auth essentials

Common methods:

- `supabase.auth.signUp(...)`
- `supabase.auth.signInWithPassword(...)`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange(...)`

Anonymous auth is different from the `anon` key:

- `anon`/publishable key identifies your app.
- Anonymous sign-in creates an authenticated user session with `is_anonymous` claim.

## Realtime essentials

Basic channel usage:

```ts
const channel = supabase.channel("room:lobby:messages", {
  config: { private: true },
});

channel
  .on("broadcast", { event: "message_sent" }, (payload) => {
    console.log(payload);
  })
  .subscribe();
```

Use RLS policies for private channel access in production.

## Storage essentials

Typical flow:

1. Create storage bucket.
2. Add RLS policies for read/write.
3. Upload file:

```ts
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`public/${file.name}`, file);
```

4. Resolve URL (public or signed URL based on bucket/privacy).

## Edge Functions essentials

CLI flow:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase functions new hello-world
supabase functions deploy hello-world
```

Invoke from app:

```ts
const { data, error } = await supabase.functions.invoke("hello-world", {
  body: { name: "JavaScript" },
});
```

## Security checklist (must-follow)

- Enable RLS on all app tables.
- Write explicit policies per table/action.
- Keep `service_role` only on trusted server environments.
- Keep frontend payloads paginated/limited.
- Validate all user input server-side (SQL functions/functions/backend).

## Useful SQL starter

```sql
create table if not exists public.todos (
  id bigserial primary key,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.todos enable row level security;
```

Example policy (dev-only style, loosened):

```sql
create policy "allow all for testing" on public.todos
for all
using (true)
with check (true);
```

Use stricter user-scoped policies in production.

## Notes for this repo

- Frontend is in `my-app/`.
- Supabase client bootstrap lives in `my-app/src/lib/supabase.ts`.
- Root env values are loaded by Vite via `my-app/vite.config.*` `envDir` setting.

---

If needed, expand this file into endpoint-by-endpoint snippets for:

- auth flows (email/password, OTP, OAuth),
- row ownership RLS policy templates,
- upload/download helpers,
- realtime presence/broadcast patterns.
