# Waitlist + Admin

Official EdgeSpark **waitlist with admin dashboard** template — public email collection on the landing page, plus a gated admin surface with stats, search, pagination, and CSV export.

## What You Get

- public landing page with email signup + waitlist counter (no auth required)
- admin sign-in flow (`/admin/login`) gated by an `ADMIN_EMAIL` env var — only the matching email gets `isAdmin: true` from `/api/me`
- admin dashboard with three stat cards, an inline 7-day trend chart (no chart library), and a sources breakdown
- admin signups list with email search, source filter, paginated table, and one-click CSV export
- D1-backed `signups(id, email unique, source, created_at)` table with index on `created_at` and migrations checked in under `server/drizzle/`
- retro-futuristic "film lab" design system (CSS film-grain, scanlines, vignette, gradient text, glow CTA) — replace tokens in `web/src/index.css` to match your brand
- agent instruction files (`AGENTS.md`) carried with the template for Claude, Codex, Gemini, Cursor, Copilot

## Use This Template

From GitHub:

```bash
edgespark init my-waitlist --agent claude --template github:edgesparkhq/official-templates/waitlist-admin
```

From a local checkout during template development:

```bash
edgespark init my-waitlist --agent claude --template /absolute/path/to/official-templates/waitlist-admin
```

## What The CLI Does

When initialized from this template, the CLI:

1. copies or downloads the template files
2. creates a fresh EdgeSpark project
3. updates `project_id` in `edgespark.toml`
4. keeps the rest of the template structure intact
5. emits `var set ADMIN_EMAIL`, `db migrate`, `auth apply`, and `deploy` next-steps

## Typical Follow-Up

For this template the CLI typically suggests:

- `cd my-waitlist/server && npm install`
- `cd my-waitlist/web && npm install`
- `edgespark var set ADMIN_EMAIL=<ask your user>` — request the email of the admin owner
- `edgespark db migrate`
- `edgespark auth apply`
- `edgespark deploy`

## Locking Down Sign-Ups

The shipped `configs/auth-config.yaml` has `disableSignUp: false` so you (the admin) can register the first account. Once that account exists, edit `configs/auth-config.yaml` to `disableSignUp: true` and re-run `edgespark auth apply` to close public sign-ups for ever after.

The waitlist email-capture form at `/` does **not** create accounts — it writes to the `signups` table via the public POST `/api/public/signup` route. Locking sign-ups does not affect the waitlist form.

## What To Replace To Make It Yours

| File | What to change |
|---|---|
| `web/src/pages/Landing.tsx` | Hero headline + paragraph, three feature cards, footer copyright |
| `web/src/components/BrandMark.tsx` | Replace the geometric scanline mark with your own logo SVG |
| `web/src/index.css` | Color tokens, fonts, design-system comments — every visual choice lives here |
| `web/index.html` | `<title>` and `<meta>` tags |
| `web/public/favicon.png` + `web/public/logo-edgespark.svg` | Replace with your own assets |

The admin pages (`/admin`, `/admin/signups`, `/admin/login`) intentionally use only generic copy — no "Your Project" placeholders to clean up.

## Server API Surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/public/signup` | none | accept `{ email, source? }`, returns `{ position, alreadySignedUp? }` |
| `GET` | `/api/public/signups/count` | none | total count of waitlist signups |
| `GET` | `/api/me` | session | current user info + `isAdmin: boolean` |
| `GET` | `/api/admin/stats` | admin | total / today / 7-day trend / source breakdown |
| `GET` | `/api/admin/signups?page=&search=&source=` | admin | paginated signups list |
| `GET` | `/api/admin/signups/export` | admin | CSV download (`signups.csv`) |
