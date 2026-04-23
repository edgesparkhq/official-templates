# Bounty Tasks

Official EdgeSpark starter template implementing a ready-to-use bounty-tasks app.

## What You Get

- a full task/bounty application with pages, routing, and state
- `server/` Hono API on Cloudflare Workers with Drizzle ORM and initial migrations
- `web/` React SPA via Vite with Tailwind, i18n, and router
- `edgespark.toml` checked in and ready for project initialization
- default auth configuration under `configs/`
- agent instruction files carried with the template

## Use This Template

From GitHub:

```bash
edgespark init my-app --agent claude --template github:edgesparkhq/official-templates/bounty-tasks
```

From a local checkout during template development:

```bash
edgespark init my-app --agent claude --template /absolute/path/to/official-templates/bounty-tasks
```

## What The CLI Does

When initialized from this template, the CLI:

1. copies or downloads the template files
2. creates a fresh EdgeSpark project
3. updates `project_id` in `edgespark.toml`
4. keeps the rest of the template structure intact
5. suggests any follow-up commands required by the app

## Typical Follow-Up

Depending on the template contents and your project configuration, the CLI may suggest commands such as:

- installing backend dependencies
- installing frontend dependencies
- `var set`
- `secret set`
- `db migrate`
- `storage apply`
- `auth apply`
- `deploy`

Run those suggestions in order, make any project-specific changes, validate the app locally, and then deploy.
