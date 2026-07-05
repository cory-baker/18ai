# 18Chesapeake

A web implementation of the 18xx-family game **18Chesapeake**, written as a TypeScript monorepo.

The repository is split into two npm workspaces:

- **`engine/`** — `@18ai/engine`, a pure TypeScript, framework-free game engine (no Angular, no rxjs, no DOM).
- **`frontend/`** — `@18ai/frontend`, the Angular application that renders the board, drives the UI, and dispatches actions through the engine. Built with Angular Material + CDK and standalone components.

A future `backend/` workspace will host a .NET API that persists the action log and brokers SignalR broadcasts; per the chosen architecture (Pattern 1) the engine remains client-authoritative and the server is a dumb pipe.

The full design — coordinates, catalogs, action shape, persistence, multiplayer, AI — is documented in [`docs/architecture.md`](docs/architecture.md). That document is the single source of truth; this README is intentionally short.

Conceptual debt to [`tobymao/18xx`](https://github.com/tobymao/18xx) is acknowledged in `docs/architecture.md` §16 — the de-facto reference 18xx implementation in Ruby/Opal. We are not porting it line-for-line, but several data shapes converge because the domain itself dictates them.

---

## Install

From the repo root, install all workspace dependencies in one shot:

```bash
npm install
```

## Run the engine tests

```bash
npm test -w engine
```

## Run the Angular dev server

```bash
npm start -w frontend
```
