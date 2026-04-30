# Flappy Bird 3D

Official EdgeSpark **game-with-leaderboard** template — a working Flappy Bird in 3D, an EdgeSpark D1 leaderboard, and difficulty tiers wired end to end.

## What You Get

- a complete WebGL Flappy Bird game in `web/src/game/` (Bird / Pipes / Environment / Game / constants) — replace this directory with your own game logic and the leaderboard keeps working
- public leaderboard API: `GET /api/public/leaderboard?difficulty=...` and `POST /api/public/scores` (no auth required)
- D1-backed `scores` table with three difficulty tiers (`rookie` / `normal` / `master`) and migrations checked in under `server/drizzle/`
- score submission flow with name input, top-20 leaderboard, medal styling (gold / silver / bronze) and GSAP-driven entry animations
- agent instruction files (`AGENTS.md`) carried with the template for Claude, Codex, Gemini, Cursor, Copilot

## Use This Template

From GitHub:

```bash
edgespark init my-game --agent claude --template github:edgesparkhq/official-templates/flappy-bird-3d
```

From a local checkout during template development:

```bash
edgespark init my-game --agent claude --template /absolute/path/to/official-templates/flappy-bird-3d
```

## What The CLI Does

When initialized from this template, the CLI:

1. copies or downloads the template files
2. creates a fresh EdgeSpark project
3. updates `project_id` in `edgespark.toml`
4. keeps the rest of the template structure intact
5. emits `db migrate` (the `scores` table migration ships in `server/drizzle/`), `auth apply`, and `deploy` next-steps

## Typical Follow-Up

For this template the CLI typically suggests:

- `cd my-game/server && npm install`
- `cd my-game/web && npm install`
- `edgespark db migrate`
- `edgespark auth apply`
- `edgespark deploy`

No `var set` / `secret set` commands are emitted — the leaderboard is anonymous and the scaffold has no required runtime keys.

## Replacing The Game

`web/src/game/` is fully isolated from the leaderboard surface. To ship a different game:

1. Replace the contents of `web/src/game/` with your own canvas / WebGL / Three.js / WebGPU implementation.
2. In `web/src/App.tsx`, swap the `FlappyBirdGame` import for your game class and adapt the lifecycle hooks (`onScoreChange`, `onGameOver`, `onStateChange`) — the leaderboard, submission form, and difficulty tabs do not need to change.
3. Optionally edit `web/src/game/constants.ts` (or your replacement) to redefine difficulty tiers — the keys flow through to the `scores.difficulty` column unchanged.

The server in `server/src/index.ts` is game-agnostic: it only validates `player_name`, `score`, and `difficulty` strings.
