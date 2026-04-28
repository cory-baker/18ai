# 18Chesapeake

A web implementation of the 18xx-family game **18Chesapeake**, written as a TypeScript monorepo.

The repository is split into two npm workspaces:

- **`engine/`** — `@18ai/engine`, a pure TypeScript, framework-free game engine (no Angular, no rxjs, no DOM). It exposes `apply(state, action) → state`, `initialState()`, action serialization, and rule helpers. Deterministic given `(initialState, actionLog)`.
- **`frontend/`** — `@18ai/frontend`, the Angular application that renders the board, drives the UI, and dispatches actions through the engine. Built with Angular Material + CDK and standalone components.

A future `backend/` workspace will host a Rails 7 API that persists the action log and brokers ActionCable broadcasts; per the chosen architecture (Pattern 1) the engine remains client-authoritative and the server is a dumb pipe.

The full design — coordinates, catalogs, action shape, persistence, multiplayer, AI — is documented in [`docs/architecture.md`](docs/architecture.md). That document is the single source of truth; this README is intentionally short.

Conceptual debt to [`tobymao/18xx`](https://github.com/tobymao/18xx) is acknowledged in `docs/architecture.md` §16 — the de-facto reference 18xx implementation in Ruby/Opal. We are not porting it line-for-line, but several data shapes converge because the domain itself dictates them.

---

## Prerequisites

- **Node.js** — version pinned in [`.nvmrc`](.nvmrc) (current Active LTS, Node 24 "Krypton" as of April 2026). With [`nvm`](https://github.com/nvm-sh/nvm): `nvm use`.
- **npm** ≥ 10 (ships with the pinned Node).

## Install

From the repo root, install all workspace dependencies in one shot:

```bash
npm install
```

This installs both `engine/` and `frontend/` and symlinks `@18ai/engine` into `node_modules` so the frontend resolves it as a workspace dependency.

## Run the engine tests

```bash
npm test -w engine
```

Vitest, strict TypeScript, ESLint, and Prettier are configured in `engine/`. Slice 1 ships with a single smoke test that exercises the placeholder export to prove the toolchain works end-to-end.

## Run the Angular dev server

```bash
npm start -w frontend
```

Defaults to `http://localhost:4200/`. The landing page renders the placeholder message imported from `@18ai/engine`, confirming the workspace wiring. Real game UI lands in subsequent slices.

## Repository layout

```
18ai/
  package.json           # npm workspaces: ["engine", "frontend"]
  README.md              # this file
  .nvmrc, .editorconfig, .gitignore
  docs/
    architecture.md      # design source of truth
  resources/             # rulebook PDF, reference board SVG, board image
  engine/                # @18ai/engine — pure TS
  frontend/              # @18ai/frontend — Angular app
```

See `docs/architecture.md` §14 for the full build order; this checkout corresponds to **slice 1 (repo skeleton)**, no game logic yet.
