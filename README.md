# EdgeSpark Official Templates

Official starter templates for building new EdgeSpark apps.

This repository is the public, team-curated catalog behind `edgespark init --template`. Each template is maintained as a normal EdgeSpark app directory so it stays easy to inspect, fork, and evolve without any custom template format.

## Available Templates

### `fullstack`

Default full-stack EdgeSpark starter with:

- an EdgeSpark backend in `server/`
- a web frontend in `web/`
- a checked-in `edgespark.toml`
- default auth configuration
- agent instruction files for AI-assisted workflows

See [fullstack/README.md](./fullstack/README.md) for template-specific details.

## Usage

Initialize a new app from a published template source:

```bash
edgespark init my-app --agent claude --template github:edgesparkhq/official-templates/fullstack
```

Initialize from a local checkout while iterating on templates:

```bash
edgespark init my-app --agent claude --template /absolute/path/to/official-templates/fullstack
```

## How Template Init Works

When you run `edgespark init --template`:

1. The CLI copies or downloads the template into a new project directory.
2. A fresh EdgeSpark project is created on the platform.
3. The CLI replaces `project_id` in the template's `edgespark.toml`.
4. The rest of the application structure is preserved.
5. The CLI suggests any follow-up steps needed by that template, such as installing dependencies, applying auth config, running migrations, or deploying.

## Template Principles

Official templates in this repository should be:

- practical: ready to use as real starting points, not demos with placeholder architecture
- opinionated: aligned with current EdgeSpark conventions
- inspectable: standard app directories with no custom template engine
- maintainable: easy to update as the platform evolves

## Status

This catalog is intentionally small to start. New official templates can be added over time as the platform surface and common app patterns mature.
