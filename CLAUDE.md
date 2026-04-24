# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack QA management tool for O2H Technology's QA team. Manages test cases, bugs, automation scripts, and documents across projects. Has a dual-mode UI: authenticated QA team members and unauthenticated developers (read-only via QA selection).

**Stack:** React 18 + TypeScript + Vite (frontend) · Express + ESM (backend) · Supabase (PostgreSQL) · JWT auth

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev       # nodemon on port 5000
npm run seed      # seed default users into Supabase
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server on port 5173
npm run build     # production build
npx tsc --noEmit  # type-check only (no test suite exists)
```

Both servers must run simultaneously for local development. The Vite dev server proxies `/api` → `http://localhost:5000`.

## Environment Variables

**backend/.env**
```
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
```

## Architecture

### Backend (`backend/src/`)

- `index.js` — Express entry point; mounts all routes, 50 MB body limit, CORS from `CLIENT_URL`
- `lib/supabase.js` — Supabase service-role client (bypasses RLS)
- `middleware/auth.js` — `authenticate` (JWT → `req.user`) and `requireAdminOrLead` middlewares
- `routes/` — 9 route modules, all mounted at `/api/<name>`:
  - `auth.js` — login, save/skip Claude key, `/me`
  - `projects.js` — CRUD + developer roster; `GET /api/projects/dev-view?qa=<name>` is public (no auth)
  - `testcases.js` — CRUD; `test_case_id` is auto-generated via Supabase RPC `get_next_test_case_id`
  - `bugs.js` — CRUD with role-based field restrictions on PATCH; `sl_no` via RPC `get_next_bug_sl_no`
  - `settings.js` — system_settings CRUD; falls back to hardcoded `DEFAULTS` if DB is empty
  - `automation.js`, `documents.js`, `comments.js`, `team.js`

The backend uses **ES modules** (`"type": "module"` in package.json) — use `import`/`export`, not `require`.

### Frontend (`frontend/src/`)

**Navigation is state-based, not route-based.** `App.tsx` uses a `screen` state variable to switch between:
`landing` → `login` → `first-login` → `app` (for QA users)
`landing` → `dev-entry` → `choose-qa` → `app` (for developers)

- `context/AuthContext.tsx` — persists `user`, `devName`, `selectedQA` to localStorage (`qa_token`, `qa_user`, `qa_role_choice`, `qa_dev_name`, `qa_selected_qa`)
- `context/ThemeContext.tsx` — dark/light theme via 44 CSS custom properties; persisted as `qa-theme`
- `lib/api.ts` — Axios instance; auto-attaches JWT on requests, auto-logout on 401
- `lib/constants.ts` — color palette (`C`), `STATUS_COLORS`, `LABEL_COLORS`, `PLATFORM_COLORS`, `LABELS`, `PLATFORMS` arrays
- `pages/ProjectShell.tsx` — the largest file (~53 KB); a single component with internal tab state (Overview, Test Cases, Bugs, Automation, Documents). All project-level interactions live here.
- `pages/Settings.tsx` — settings management; fetches live from `/api/settings`, no hardcoded values
- `components/ui/` — shared UI primitives (`GCard`, `Chip`, `Btn`, `Inp`, `Sel`)

All server state is managed with **@tanstack/react-query**. Mutations invalidate the relevant query keys on success. Toast notifications use **react-hot-toast**.

### Database (`supabase/schema.sql`)

Run the full `schema.sql` in the Supabase SQL Editor to initialize. Key design points:

- `system_settings` — stores all dropdown/chip values (labels, platforms, priorities, statuses) with per-value `color` and `sort_order`
- `test_cases.steps` — stored as `JSONB`; `test_cases.labels` is a `TEXT[]` array
- Auto-increment IDs use Supabase RPC functions (`get_next_test_case_id`, `get_next_bug_sl_no`) rather than sequences, to allow project-scoped IDs (e.g. `PROJ001`)
- `updated_at` triggers on `projects`, `test_cases`, `bugs`, `automation_scripts`
- The backend uses the **service role key** — RLS is not enforced; access control is handled in Express middleware

## Role System

| Role | Access |
|------|--------|
| `admin` | All projects, all CRUD, team management |
| `qa_lead` | All projects, all CRUD, team management |
| `qa_engineer` | Only assigned projects (`project_assignments` table) |
| developer (no auth) | Read-only; sees projects for a chosen QA via `dev-view` endpoint |

Bug PATCH has additional role-based field restrictions enforced in `bugs.js`.

## Key Patterns

- **Settings fallback:** `settings.js` returns DB rows if they exist, otherwise falls back to the `DEFAULTS` object in the same file. The frontend additionally falls back to constants in `constants.ts`.
- **Project auto-scaffold:** Creating a project auto-creates `automation_scripts` rows (Playwright for web, Selenium for mobile/both).
- **Claude API key:** Stored per-user in `users.claude_api_key`; surfaced during first login. Used for AI test generation features.
- **Developer mode:** Completely separate from QA auth — no JWT, uses `qa_dev_name`/`qa_selected_qa` localStorage keys, hits `/api/projects/dev-view`.

## Deployment

- **Frontend:** Vercel (`vercel.json` rewrites all paths to `index.html`)
- **Backend:** Railway (`Procfile`: `web: node src/index.js`)
- **Database:** Supabase (hosted Postgres)
