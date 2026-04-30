# Login — Frosted Glass

Official EdgeSpark login template with a frosted-glass surface over a live WebGL water-caustic background.

## What You Get

- glassmorphic sign-in / sign-up flow backed by EdgeSpark auth (real sessions, not a mock)
- pure-WebGL caustic shader background with zero animation dependencies
- `server/src/defs/runtime.ts` pre-declares OAuth `VarKey` and `SecretKey` unions for GitHub, Google, Discord, and GitLab — wire credentials and the buttons start working
- `configs/auth-config.yaml` with email/password and four OAuth providers enabled out of the box
- agent instruction files (`AGENTS.md`) carried with the template for Claude, Codex, Gemini, Cursor, Copilot

## Use This Template

From GitHub:

```bash
edgespark init my-app --agent claude --template github:edgesparkhq/official-templates/login-frosted-glass
```

From a local checkout during template development:

```bash
edgespark init my-app --agent claude --template /absolute/path/to/official-templates/login-frosted-glass
```

## What The CLI Does

When initialized from this template, the CLI:

1. copies or downloads the template files
2. creates a fresh EdgeSpark project
3. updates `project_id` in `edgespark.toml`
4. keeps the rest of the template structure intact
5. emits `var set` / `secret set` lines for every OAuth `VarKey` / `SecretKey` declared in `server/src/defs/runtime.ts`, plus `auth apply` and `deploy`

## Typical Follow-Up

For this template the CLI typically suggests:

- `cd my-app/server && npm install`
- `cd my-app/web && npm install`
- `edgespark var set GITHUB_CLIENT_ID=<ask your user>` (and the matching `GOOGLE_*` / `DISCORD_*` / `GITLAB_*` ids)
- `edgespark secret set GITHUB_CLIENT_SECRET` (and the matching secrets — opens a browser URL the user pastes into)
- `edgespark auth apply`
- `edgespark deploy`

OAuth providers you do not need can be disabled in `configs/auth-config.yaml` before `auth apply`. The matching `VarKey` / `SecretKey` entries in `server/src/defs/runtime.ts` can stay or be removed — leaving them costs nothing.
