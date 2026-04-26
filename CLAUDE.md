# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**LANDED** — a multilingual onboarding app for New York City newcomers. Users pick a language, sign up/log in, choose a persona type, and are routed to resources.

Two sub-projects that talk to each other:
- `my-app/` — React 19 + Vite 7 frontend
- `backend/` — Flask backend handling auth and user profiles via Supabase

## Commands

Frontend (run from `my-app/`):

```bash
npm install
npm run dev        # Vite dev server → localhost:5173
npm run build
npm run lint       # ESLint
```

Backend (run from `backend/`):

```bash
source venv/bin/activate
pip install -r requirements.txt
python app.py      # Flask dev server → localhost:5000
```

## Environment variables

The `.env` file lives at the **repo root**. Vite reads it via `envDir: ".."` in `vite.config.js`; Flask reads it via `python-dotenv` with the same path.

Frontend needs:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=   # anon/public key
VITE_BACKEND_URL=                # leave empty in dev — Vite proxy handles it
```

Backend needs:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # service role key, NOT the anon key
```

## Architecture

### Screen navigation flow

`LandingPage.jsx` owns all navigation via a `currentScreen` state string — there is no router. The flow is:

```
intro → language → auth → userType → newNeighborHome (if neighbor)
                                   → dashboard (all other types)
```

`ProtectedScreen` wraps the `userType` and `dashboard` screens; it redirects to `auth` if `AuthContext` has no user.

### Auth

`AuthContext.jsx` persists the user object to `localStorage` under the key `landed_user`. Auth calls go through the Flask backend (`/auth/signup`, `/auth/login`) which uses the Supabase **service role key** to call `supabase.auth`. The frontend's own `lib/supabase.js` client (using the anon key) is available but not yet used for auth flows.

### Vite proxy

In dev, `vite.config.js` proxies `/auth/*` and `/users/*` to `http://127.0.0.1:5000`, so `fetch("/auth/login")` hits Flask without CORS issues. `VITE_BACKEND_URL` defaults to `""` to exploit this proxy.

### i18n

`i18n.js` initializes `react-i18next` with inline translation resources. Only `en` and `es` have translations; all other language cards (`zh`, `ar`, etc.) map to `code: "en"` as a placeholder. Detection order: `localStorage` → browser navigator.

### Backend API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Creates Supabase auth user, upserts into `users` table |
| POST | `/auth/login` | Signs in, returns `access_token` + user object |
| PATCH | `/users/profile` | Updates `language_code` and `persona_type` on `users` table |

The `users` table in Supabase must have columns: `id`, `email`, `language_code`, `persona_type`.
