# Login — Terminal CLI

Official EdgeSpark login template styled as a terminal session — minimal, monospace, agent-native.

## What You Get

- terminal-aesthetic sign-in / sign-up flow backed by EdgeSpark auth (real sessions, not a mock)
- monospace UI that matches the EdgeSpark CLI / agent feel
- `configs/auth-config.yaml` with email/password enabled out of the box; OAuth providers ready to switch on
- empty `server/src/defs/runtime.ts` `VarKey` / `SecretKey` unions — declare keys here as you add OAuth providers
- agent instruction files (`AGENTS.md`) carried with the template for Claude, Codex, Gemini, Cursor, Copilot

## Use This Template

From GitHub:

```bash
edgespark init my-app --agent claude --template github:edgesparkhq/official-templates/login-terminal-cli
```

From a local checkout during template development:

```bash
edgespark init my-app --agent claude --template /absolute/path/to/official-templates/login-terminal-cli
```

## What The CLI Does

When initialized from this template, the CLI:

1. copies or downloads the template files
2. creates a fresh EdgeSpark project
3. updates `project_id` in `edgespark.toml`
4. keeps the rest of the template structure intact
5. emits `auth apply` and `deploy` next-steps; no `var set` / `secret set` until you declare provider keys

## Typical Follow-Up

For this template the CLI typically suggests:

- `cd my-app/server && npm install`
- `cd my-app/web && npm install`
- `edgespark auth apply`
- `edgespark deploy`

To turn on a social provider, add the provider's `VarKey` / `SecretKey` to `server/src/defs/runtime.ts`, enable it in `configs/auth-config.yaml`, and re-run `edgespark var set`, `edgespark secret set`, then `edgespark auth apply`.
