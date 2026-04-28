# 18Chesapeake — Architecture & Design Spec

**Status:** Draft v1, before code is written.
**Audience:** Cory (the developer) and any AI assistant working on this repo.
**Purpose:** Single source of truth for high-level design decisions. Re-attach this doc to every new chat that starts a fresh implementation slice. Update it when decisions change.

---

## 1. Game scope

- **Game:** 18Chesapeake (full ruleset, including 2-player variant later).
- **Players:** Local hot-seat solo, online multiplayer, and solo-vs-AI.
- **Platform:** Web only. Desktop-first; mobile is non-goal for v1.
- **Persistence:** Server-side, account-bound. Resume a game across devices and sessions.
- **Quality target:** Polished single-player game feel (drag-and-drop tiles, animations, sound cues), not a spreadsheet-style web app like 18xx.games.

---

## 2. Top-level architecture

### 2.1 Repo layout (npm workspaces)

```
18ai/
  package.json                 # workspaces: ["frontend", "engine"]
  README.md
  docs/
    architecture.md            # this file
    rules-decisions.md         # ambiguous-rule rulings (created as we hit them)
  resources/                   # rulebook + reference board (already present)
  engine/                      # @18ai/engine — pure TS, framework-free
    package.json
    tsconfig.json
    vitest.config.ts
    src/
      coords/                  # axial math, edges, rotations
      data/                    # static catalogs (map, tiles, companies, trains, market)
      state/                   # GameState shape, initialState builder
      actions/                 # Action classes (validate + apply + toJSON)
      rules/                   # rule helpers, organized by phase/concern
      routes/                  # graph + revenue calculation
      ai/                      # heuristic bot (later) and LLM adapter (later)
      index.ts                 # public surface: apply(), initialState(), Action.fromJSON(), …
    test/                      # vitest specs, lots of them
  frontend/                    # Angular app
    package.json               # depends on "@18ai/engine": "workspace:*"
    angular.json
    src/app/
      pages/                   # route-level components
      components/              # presentational components (board, hex, tile, …)
      services/                # Angular DI services (game state, sockets, auth, …)
      ui/                      # reusable UI bits (theme, dialogs, …)
  backend/                     # Rails 7 API-only (added when engine is solid)
    Gemfile
    config/
    app/
      models/
      controllers/api/
      channels/                # ActionCable
    db/
    spec/
```

**Rule:** the engine package never imports from `@angular/*`, `rxjs`, or any frontend dep. This is enforced by *not* listing them in `engine/package.json`.

### 2.2 Pattern 1 (chosen): client-authoritative engine, dumb-pipe server

- Engine runs **only in the Angular client**. It is a pure TS library that imports nowhere upward.
- Rails is a **dumb pipe + auth + persistence**. It does not understand `Action`s; it stores them as opaque JSON and broadcasts them via ActionCable.
- Multiplayer convergence happens because the engine is deterministic: every client applies the same actions in the same order and produces the same state.
- The snapshot in Postgres is a cache, not the source of truth. The action log is the truth.

**Upgrade path to Pattern 2 (server-authoritative):** if cheating ever becomes a concern, spin up a Node sidecar that imports the same `@18ai/engine` package and validates actions before Rails persists them. No engine changes required.

---

## 3. Core data primitives

### 3.1 Coordinates: axial `(q, r)` internally, `'F-8'` strings externally

Internal math uses **axial coordinates** (see [Red Blob Games](https://www.redblobgames.com/grids/hexagons/)).

```ts
export interface AxialHex { q: number; r: number; }
```

External labels (UI, seed JSON, debug logs) use 18xx-standard `'COL-ROW'` strings (`'F-8'`).

Each `HexSlot` in the map manifest carries both:

```ts
export interface HexSlot {
  id: string;          // 'F-8'  — human-friendly, immutable
  q: number;           // axial q
  r: number;           // axial r
  // …kind-specific fields below
}
```

The full `HexSlot` is a **discriminated union** (see §4.1). Naming note: we call it `HexSlot` rather than `Hex` to avoid collision with `AxialHex` (the pure coordinate pair) — a `HexSlot` is *a position on the board with terrain and metadata*, not just `(q, r)`.

Conversion happens once at map-load time. After that, all algorithms (neighbor lookup, distance, rotation, route walking) work on `(q, r)`.

### 3.2 Hex orientation: **flat-top**

18xx tiles are **flat-top hexes** — flat edges on top and bottom, vertices on left and right. This is locked in (matches the rulebook art and 18xx convention universally). All coordinate math, pixel layout, and edge naming below assumes flat-top.

```
   ___________
  /           \
 /             \
 \             /
  \___________/
```

### 3.3 Edges: integers `0..5`, with named helpers

For a flat-top hex, edges face cardinal/intercardinal directions. Numbered clockwise starting from the top edge:

```
        N (0)
       _______
   NW /       \ NE
  (5) \       / (1)
       -------
       _______
   SW /       \ SE
  (4) \       / (2)
       -------
        S (3)
```

(Visual is approximate — it's a single flat-top hex with the top edge labeled N=0, top-right NE=1, bottom-right SE=2, bottom S=3, bottom-left SW=4, top-left NW=5.)

```ts
export type EdgeId = 0 | 1 | 2 | 3 | 4 | 5;
export const Edge = { N: 0, NE: 1, SE: 2, S: 3, SW: 4, NW: 5 } as const;
const EDGE_NAMES = ['N','NE','SE','S','SW','NW'] as const;
export const edgeName = (e: EdgeId): typeof EDGE_NAMES[number] => EDGE_NAMES[e];
export const parseEdge = (n: typeof EDGE_NAMES[number]): EdgeId => EDGE_NAMES.indexOf(n) as EdgeId;
```

Seed JSON and renderer output use `'NE'` strings; engine math uses `1`. Convert at the boundary.

### 3.4 Coordinate / edge utilities

(Deltas below are the **flat-top axial** standard from [Red Blob Games](https://www.redblobgames.com/grids/hexagons/#neighbors-axial).)

```ts
const NEIGHBOR_DELTAS: ReadonlyArray<{q:number; r:number}> = [
  { q:  0, r: -1 },  // N
  { q: +1, r: -1 },  // NE
  { q: +1, r:  0 },  // SE
  { q:  0, r: +1 },  // S
  { q: -1, r: +1 },  // SW
  { q: -1, r:  0 },  // NW
];

export const rotateEdge = (e: EdgeId, rot: number): EdgeId =>
  (((e + rot) % 6) + 6) % 6 as EdgeId;

export const oppositeEdge = (e: EdgeId): EdgeId =>
  ((e + 3) % 6) as EdgeId;

export const neighborOf = (h: AxialHex, e: EdgeId): AxialHex => ({
  q: h.q + NEIGHBOR_DELTAS[e].q,
  r: h.r + NEIGHBOR_DELTAS[e].r,
});

export const hexDistance = (a: AxialHex, b: AxialHex): number => {
  const dq = a.q - b.q, dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};
```

These three utilities + the `EDGE_NAMES` table replace the entire ~95-line `translateRotation` switch and the asymmetric `getNeighboringHexes` function from the previous attempt.

### 3.5 Money and shares

All money is **integer dollars**. All share counts are **integers** (one share = 10% ownership, except the president's certificate which is two shares' worth of voting power but counts as 20% ownership). No floats anywhere in the engine.

---

## 4. Static data (catalogs)

Catalogs live in `engine/src/data/` as TS modules (typed `.ts` files, not raw JSON, so the compiler validates them). They never mutate at runtime.

### 4.1 Map manifest (`map.ts`)

The board is a list of hex slots, each of which is one of several **kinds** (open, city, town, offboard, static-track). We model this as a [**discriminated union**].

```ts
type HexSlot =
  | OpenHexSlot
  | CityHexSlot
  | TownHexSlot
  | OffboardHexSlot
  | StaticTrackHexSlot   // grey pre-printed track that never upgrades
  ;

interface HexSlotBase {
  id: string;          // 'F-8'
  q: number; r: number;
  name?: string;       // 'Washington DC'
  label?: 'B' | 'OO' | 'DC';   // tile-matching label for upgrades
  terrain?: { mountain?: true; water?: true };
  upgradeCost?: number;          // $40 for mountains, etc.
}

interface OpenHexSlot extends HexSlotBase { kind: 'open'; }

interface CityHexSlot extends HexSlotBase {
  kind: 'city';
  initialTileId?: string;        // pre-printed yellow city, if any
  homeFor?: CompanyId;           // company that starts here
}

interface TownHexSlot extends HexSlotBase { kind: 'town'; dits: 1 | 2; }

interface OffboardHexSlot extends HexSlotBase {
  kind: 'offboard';
  revenueByPhase: { yellow: number; green: number; brown: number; gray: number };
  exits: EdgeId[];               // which edges connect to the live board
}

interface StaticTrackHexSlot extends HexSlotBase {
  kind: 'static_track';
  paths: Path[];                 // pre-printed track that doesn't upgrade
}
```

The benefit: code can `switch (slot.kind)` and TypeScript will know inside each branch which extra fields are valid. E.g. inside `case 'offboard'`, `slot.revenueByPhase` is known to exist; inside `case 'open'`, accessing it would be a compile error. No defensive `if (slot.revenueByPhase)` checks scattered through the codebase.

### 4.2 Tile catalog (`tiles.ts`)

A tile definition is **geometry + decorations**, never bound to a hex.

```ts
type TileColor = 'yellow' | 'green' | 'brown' | 'gray';

interface TileDef {
  id: string;                   // '9', '57', 'X1', '611'
  color: TileColor;
  quantity: number;             // copies in the box; -1 for unlimited
  cities: CityStop[];
  paths: Path[];
  label?: 'B' | 'OO' | 'DC';    // restricts which hexes can receive it
}

interface CityStop {
  id: number;                   // 0, 1 — local to this tile
  kind: 'city' | 'town';
  slots: number;                // 1 single-slot city, 2 OO double-slot, 0 town
  revenue: number;              // base value (off-board uses phase table instead)
}

interface Path {
  a: PathEnd;
  b: PathEnd;
}
type PathEnd =
  | { kind: 'edge'; edge: EdgeId }
  | { kind: 'stop'; stopId: number };
```

A path always has exactly two endpoints. A track that visits a city is *two paths*: edge → stop, stop → edge. The city stop is a real graph node.

**Upgrade rules** are encoded in two layers:

1. **Static candidate table** (`tileId → tileId[]`) — for each existing tile, the *designer-blessed* set of tiles that may replace it. This is transcribed by hand from §18 of the rulebook (Tile Upgrade Chart). It answers "is X even a candidate to become Y?" — fast O(1) lookup, used by the UI to populate the "valid upgrades" picker.

2. **Runtime placement check** — given a candidate upgrade, is *this specific placement* legal? This is dynamic and considers: rotation, edge preservation (existing track endpoints must connect on the new tile), label match (`OO`/`DC`), city slot capacity (≥ existing slots), station marker preservation, and terrain rules. Lives in `rules/Placement`.

Why both: the candidate table can't be fully derived from "rules" because some pairs that physically fit are not designer-blessed upgrades, and computing candidates dynamically (test every catalog tile × 6 rotations) is slower for tight UI loops. The runtime check handles all the situational legality so we don't duplicate that logic in the table.

### 4.3 Company catalog (`companies.ts`)

```ts
interface CompanyDef {
  id: CompanyId;                // 'B&O', 'PRR', …
  name: string;                 // 'Baltimore & Ohio Railroad'
  abbr: string;                 // 'B&O' (display)
  color: string;                // charter color, hex
  homeHexId: string;            // 'H-6'
  homeStopId?: number;          // when home tile has 2 cities
  parPrices: number[];          // legal IPO prices [60, 65, 70, …]
}
```

### 4.4 Train catalog (`trains.ts`)

```ts
interface TrainDef {
  id: '2' | '3' | '4' | '5' | '6' | 'D';
  cost: number;
  quantity: number;             // -1 = infinite
  stops: number;                // 'D' uses Infinity; encode as Number.POSITIVE_INFINITY at runtime
  triggersPhase: PhaseId;       // first purchase advances to this phase
  rusts?: TrainDef['id'];       // when this train type is bought, this older type rusts
  upgradeFrom?: { fromId: TrainDef['id']; tradeInPrice: number }; // 'D' upgrade
}
```

### 4.5 Market and phases

```ts
interface MarketCell {
  price: number;
  color?: 'yellow' | 'orange' | 'brown';   // par/yellow/movement bands
}
interface Market { grid: MarketCell[][]; }  // 2D, addressed by [row][col]

interface PhaseDef {
  id: PhaseId;                   // '2' | '3' | '4' | '5' | '6' | 'D'
  trainLimit: number;            // per company
  privatesClose: boolean;        // privates close at phase 5
  tileColors: TileColor[];       // which tile colors are legal to lay
}
```

### 4.6 Privates (`privates.ts`)

```ts
interface PrivateDef {
  id: PrivateId;                 // 'DH', 'M&H', 'C&P', …
  name: string;
  cost: number;                  // face value at auction start
  revenue: number;               // per OR set
  ability?: PrivateAbility;      // special powers (data-driven, see §6.4)
  closesAt?: PhaseId;
}
```

---

## 5. Game state (mutates per action)

State is **plain TS interfaces** (not classes). Always JSON-serializable. Every action returns a new state value; the previous one is left untouched.

```ts
interface GameState {
  schemaVersion: number;          // bump when state shape changes
  rngSeed: string;                // for reproducible randomness (auction order, etc.)

  phase: PhaseId;
  round: Round;                   // { kind: 'private_auction' } | { kind: 'stock', orNumber: 0 } | { kind: 'operating', orNumber, setIndex, companyTurn } | …
  priorityDeal: PlayerId;         // who has priority this stock round
  activePlayer: PlayerId;         // whose turn it is to act
  activeCompany: CompanyId | null;// during OR

  players: Player[];              // ordered by turn order
  companies: Record<CompanyId, Company>;
  privates: Record<PrivateId, Private>;

  bank: { cash: number; exhausted: boolean };

  trainSupply: TrainSupplyState;  // unsold trains by type
  market: MarketState;            // share-price positions per company
  tilePool: Record<string, number>; // remaining count per tile id
  placements: TilePlacement[];    // every laid tile (incl. initial)
  stations: StationMarker[];      // every station marker on the board

  log: LogEntry[];                // human-readable game log (separate from action log)
}

interface Player {
  id: PlayerId;
  name: string;
  cash: number;
  shares: Record<CompanyId, number>;        // 1 share = 10%
  presidencies: CompanyId[];                 // president certificate per corp
  privates: PrivateId[];
  passedThisRound: boolean;
}

interface Company {
  id: CompanyId;
  floated: boolean;
  parPrice?: number;
  treasury: number;
  trains: TrainId[];
  trainsRusted: TrainId[];      // for log/UI
  ipoShares: number;            // shares still in IPO
  poolShares: number;           // shares in market pool
  operated: boolean;            // operated this OR set
  withheld: boolean;            // last OR's dividend decision
}

interface TilePlacement {
  hexId: string;
  tileId: string;
  rotation: 0|1|2|3|4|5;
  laidByCompanyId?: CompanyId;  // null/undefined for initial tiles
  laidInActionIdx?: number;     // for log/undo support if ever added
}

interface StationMarker {
  hexId: string;
  stopId: number;               // which city stop on the tile
  companyId: CompanyId;
}
```

### 5.1 Initial state

`initialState({ players, seed })` returns a fresh `GameState` at action 0 — including initial tile placements (B&O home at H-6, LVR home at J-2, etc.) and pre-printed off-board / static-track tiles. **This is the same shape as a saved game mid-play.** There is no separate "initial state" data shape.

### 5.2 Catalogs are referenced, not copied

Nothing in `GameState` duplicates catalog data. A `TilePlacement` carries `tileId: '57'` and the engine looks up `TileCatalog['57']` for geometry/colors/cities. Catalogs are immutable; if you edit `TileCatalog`, every game uses the new definition (so don't edit them mid-game without versioning).

---

## 6. Actions

### 6.1 Action shape

Actions are **classes** with `validate`, `apply`, `toJSON`, plus a static `fromJSON`. This collocates the three things you'll always look up together when debugging an action.

```ts
export type Result =
  | { ok: true }
  | { ok: false; reason: string; code?: string };

export abstract class Action {
  abstract readonly type: string;
  abstract validate(state: GameState): Result;
  abstract apply(state: GameState): GameState;     // returns NEW state
  abstract toJSON(): Record<string, unknown>;
  static fromJSON(data: { type: string; [k: string]: unknown }): Action {
    return ACTION_REGISTRY[data.type].fromJSON(data);
  }
}

export class BuyShareAction extends Action {
  readonly type = 'buy_share' as const;
  constructor(
    readonly playerId: PlayerId,
    readonly companyId: CompanyId,
    readonly source: 'ipo' | 'pool',
  ) { super(); }

  validate(state: GameState): Result { /* … */ }
  apply(state: GameState): GameState { /* returns new state */ }
  toJSON() { return { type: this.type, playerId: this.playerId, companyId: this.companyId, source: this.source }; }
  static fromJSON(d: any) { return new BuyShareAction(d.playerId, d.companyId, d.source); }
}
```

### 6.2 The engine entry point

```ts
export function apply(state: GameState, action: Action): { ok: true; state: GameState } | { ok: false; reason: string } {
  const v = action.validate(state);
  if (!v.ok) return v;
  return { ok: true, state: action.apply(state) };
}
```

That's the whole engine surface. Plus `initialState`, `Action.fromJSON`, and read-only helpers (`legalActions(state)`, `currentPhase(state)`, etc.).

### 6.3 Rule helpers

Rule logic that's shared across actions (placement legality, route enumeration, market math, dividend calculation) lives in `engine/src/rules/`. Organized as **static class namespaces** for OOP-feeling APIs, e.g.:

```ts
class Placement {
  static isLegal(state: GameState, hexId: string, tileId: string, rotation: number, byCompany: CompanyId): Result;
  static legalRotations(state: GameState, hexId: string, tileId: string, byCompany: CompanyId): number[];
  static legalTilesFor(state: GameState, hexId: string, byCompany: CompanyId): string[];
}

class Market {
  static moveDownAfterSale(state: GameState, companyId: CompanyId, sharesSold: number): GameState;
  static moveRightAfterDividend(state: GameState, companyId: CompanyId): GameState;
  static moveLeftAfterWithhold(state: GameState, companyId: CompanyId): GameState;
}
```

These are pure functions wrapped in classes for namespacing. They never mutate inputs.

### 6.4 Private company abilities

Modeled as data, not subclasses:

```ts
type PrivateAbility =
  | { kind: 'tile_lay'; hexes: string[]; freeOfCharge: true; closesOnUse: true }   // D&H tunnel
  | { kind: 'terrain_discount'; discount: number }                                   // Mountain Express, etc.
  | { kind: 'reserved_share'; companyId: CompanyId };                                // president of a corp
```

Action handlers check `ability.kind` and execute the right effect. New abilities are added by extending the union and the dispatch.

---

## 7. Tile rendering (data → SVG)

**No static SVG files for tiles.** Every tile is rendered from its `TileDef` at runtime. This decision is mandatory for: rotation, phase-dependent revenue display, hover/legality highlighting, and AI preview overlays.

### 7.1 The hex coordinate system in pixels

Hexes are **flat-top** (see §3.2). Default size constants matching the existing reference SVGs (`viewBox="-100 -87 200 174"`):

```ts
const HEX_RADIUS = 100;                          // center to vertex
const HEX_HEIGHT = HEX_RADIUS * Math.sqrt(3);    // ≈ 173.2
const POLY_POINTS = '100,0 50,87 -50,87 -100,0 -50,-87 50,-87';
```

For flat-top hexes, pixel position of a hex from `(q, r)`:

```ts
function hexToPixel(h: AxialHex): {x: number; y: number} {
  return { x: 1.5 * HEX_RADIUS * h.q,
           y: HEX_HEIGHT * (h.r + h.q / 2) };
}
```

Pixel position of edge midpoints (in tile-local coords, before tile rotation):

```ts
const EDGE_MIDPOINTS: ReadonlyArray<{x:number; y:number}> = [
  { x:    0, y: -87 },   // N  — top edge midpoint
  { x:   75, y: -43 },   // NE
  { x:   75, y:  43 },   // SE
  { x:    0, y:  87 },   // S  — bottom edge midpoint
  { x:  -75, y:  43 },   // SW
  { x:  -75, y: -43 },   // NW
];
```

(Numbers tuned to match the existing reference SVGs.)

### 7.2 The renderer

A single Angular attribute-selector component renders any tile:

```html
<svg [attr.viewBox]="viewBox">
  <g [attr.transform]="'translate(' + boardOriginX + ',' + boardOriginY + ')'">
    <g app-hex *ngFor="let h of hexes; trackBy: trackByHexId"
       [hex]="h" [placement]="placementFor(h.id)" [phase]="currentPhase">
    </g>
  </g>
</svg>
```

```ts
@Component({
  selector: 'g[app-hex]',
  template: `
    <g [attr.transform]="'translate(' + cx + ',' + cy + ')'">
      <polygon [attr.points]="POLY_POINTS" [attr.fill]="bgColor" stroke="black" stroke-width="2" />
      <g app-tile *ngIf="placement"
         [def]="tileDefFor(placement.tileId)"
         [rotation]="placement.rotation"
         [phase]="phase">
      </g>
      <text [attr.y]="-70" text-anchor="middle" font-size="14">{{ hex.id }}</text>
    </g>
  `,
})
export class HexComponent { /* … */ }

@Component({
  selector: 'g[app-tile]',
  template: `
    <g [attr.transform]="'rotate(' + (60 * rotation) + ')'">
      <!-- background polygon if this is a placed tile (vs decorating an existing hex) -->
      <ng-container *ngFor="let path of def.paths">
        <ng-container *ngTemplateOutlet="trackPath; context: { $implicit: path }" />
      </ng-container>
      <ng-container *ngFor="let stop of def.cities">
        <ng-container *ngTemplateOutlet="cityStop; context: { $implicit: stop }" />
      </ng-container>
    </g>
  `,
})
export class TileComponent { /* derives endpoints, draws double-stroke paths and city circles */ }
```

The `app-tile` component's job:

1. For each `Path`, compute pixel coords for its two endpoints (edge midpoint or city stop center).
2. Emit a thick white stroke under a thinner black stroke (matches the existing visual style).
3. For each city stop, emit circles (one for single-slot, two-circle pill for OO).
4. For each city stop with revenue, emit a revenue badge.
5. For named hexes, render the name.

Rotation is a single `transform="rotate(60 * r)"` on the outer `<g>`. No per-rotation files, no per-rotation calculation in TS.

**This is one of the slices we'll do in teaching mode.** Plan: walk through the geometry, build the renderer step-by-step, render the empty board first, then add yellow tile #9 (straight track), then a city tile, then OO. Each step is its own commit.

---

## 8. The action log and persistence

### 8.1 Schema (Postgres)

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL,          -- 'lobby' | 'active' | 'finished'
  schema_version  INTEGER NOT NULL,
  player_ids      UUID[] NOT NULL,
  current_action_idx INTEGER NOT NULL DEFAULT 0,
  state_snapshot  JSONB,                   -- cache; nullable
  snapshot_at_idx INTEGER,                 -- which action this snapshot reflects
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_actions (
  id           BIGSERIAL PRIMARY KEY,
  game_id      UUID NOT NULL REFERENCES games(id),
  idx          INTEGER NOT NULL,           -- 0-based, dense, unique per game
  player_id    UUID,                       -- NULL for system actions
  payload      JSONB NOT NULL,             -- the Action.toJSON() blob
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, idx)
);

CREATE INDEX idx_game_actions_game_idx ON game_actions (game_id, idx);
```

### 8.2 Submitting an action

`POST /api/games/:id/actions` body:

```json
{ "expectedIdx": 47, "action": { "type": "buy_share", "playerId": "…", "companyId": "B&O", "source": "ipo" } }
```

Server:

1. Auth: requester is in `player_ids`.
2. Optimistic concurrency: insert `(game_id, idx=47, payload)`. If `UNIQUE` constraint violated, return 409 Conflict; client refetches and retries.
3. Update `games.current_action_idx`.
4. Broadcast on the game's ActionCable channel: `{ idx: 47, action: {...} }`.
5. **Don't validate.** Server is dumb. Validation lives in the engine, on the client.

### 8.3 Loading a game

1. Client fetches `state_snapshot` and `snapshot_at_idx`.
2. Client fetches `game_actions WHERE idx > snapshot_at_idx`.
3. Client `state = actions.reduce((s, a) => apply(s, Action.fromJSON(a.payload)).state, snapshot)`.
4. Client subscribes to ActionCable channel for new actions.

### 8.4 Snapshotting

Every `N` actions (e.g. 25), the client `POST /api/games/:id/snapshot { idx, state }` updates the cache. Server stores it. Loading is then capped at `N` replays. The action log remains the source of truth; corrupted snapshots can always be rebuilt by replaying from 0.

### 8.5 No undo (decision)

Undo is intentionally not supported. Action log is for forensics, replay, and bug remediation — not user-facing rewind.

### 8.6 Rails tooling

When the backend is scaffolded (slice 13), the following gems are required:

- **[`devise`](https://github.com/heartcombo/devise)** — authentication. Handles user signup, login, sessions, password reset, email confirmation. Standard Rails auth solution; no custom auth code unless we hit a real reason. The `User` model in §8.1 will be a Devise model.
- **[`annotate`](https://github.com/ctran/annotate_models)** — adds schema annotations as comments at the top of every ActiveRecord model file. Keeps `app/models/*.rb` self-documenting (column names, types, indexes, foreign keys all visible without leaving the file). Run via `bundle exec annotate` after migrations; recommended to wire into a Rails generator hook so it runs automatically.

Other Rails choices already implied by the spec:

- **Rails 7 API-only mode** (`rails new backend --api --database=postgresql`).
- **PostgreSQL** (not SQLite) — `JSONB` is required for `state_snapshot` and `payload`.
- **ActionCable** for WebSocket broadcasts (built into Rails, no extra gem).
- **RSpec** for testing (per §13.3).

This list is not exhaustive — additional gems (Sidekiq for background jobs, etc.) will be added in their respective slices and noted here as they're chosen.

---

## 9. Multiplayer concurrency

### 9.1 Optimistic concurrency via action index

The `(game_id, idx) UNIQUE` constraint is the entire concurrency story. If two clients submit `idx=47` simultaneously, exactly one succeeds. The loser refetches and retries with `idx=48`.

Combined with engine determinism, this means all clients converge on the same state after applying actions in `idx` order.

### 9.2 Whose turn is it

`state.activePlayer` is computed by the engine. The server enforces "your action's `payload.playerId` matches `state.activePlayer`" by replaying — but in Pattern 1 we don't validate server-side, so this is a *client-side* check (and broadcast clients reject illegal actions on receipt). If we ever care, the server-side check is a one-line addition.

### 9.3 Real-time delivery

ActionCable broadcasts every accepted action to subscribed clients. Each client applies the action through its own engine instance. UI updates from the resulting state via Angular signals (see §10.2).

### 9.4 Async play

18xx games run for days/weeks. When it becomes someone's turn, send an email/push notification (job queue: Sidekiq + Redis). Out of scope for v1; design endpoint shape in advance.

---

## 10. Frontend (Angular)

### 10.1 UI stack

- **Angular Material** for chrome (toolbars, dialogs, snackbars, menus, buttons, inputs).
- **Angular CDK** for drag-and-drop (tile placement) and overlays.
- **No Tailwind, no Bootstrap.** Component-scoped SCSS for everything else.
- Custom Material theme in `frontend/src/styles/theme.scss` with a period-appropriate palette (rich greens, browns, brass; not Material 3 default purple).
- Typography: slab serif for headings/company names, system sans for UI, monospace for prices and integers.

### 10.2 State management

- **One `GameStateService`** (Angular DI singleton) holds the current `GameState` in an Angular signal.
- Components read derived values via `computed()` signals.
- Mutations go through a `dispatch(action: Action)` method, which:
  1. Calls `engine.apply(currentState, action)`.
  2. On `ok`, posts to backend, updates the local signal.
  3. On error, shows a snackbar.
- Incoming actions from ActionCable also flow through `dispatch`-without-network.
- **No NgRx, no MobX.** Signals + the engine reducer is enough.

### 10.3 Routing

```
/                               # landing
/games                          # my games list
/games/new                      # new game wizard
/games/:id                      # game board (the main view)
/games/:id/lobby                # pre-start lobby
/auth/{login,signup}
```

### 10.4 The board

- Single SVG element, `viewBox` sized to the board.
- `<g app-hex>` per hex via `*ngFor`.
- Drag source: the tile rack (CDK `cdkDrag`).
- Drop target: each hex (CDK `cdkDropList` with custom predicate calling `Placement.isLegal`).
- During drag: ghost preview, snap-to-hex, hover halo (green = legal, red = illegal with reason in tooltip).

### 10.5 Polish budget

Polish (animations, sounds, custom theme details, transitions) is a **dedicated phase at the end**, not interleaved with feature work. Prototype all features unstyled-but-functional first.

---

## 11. AI

### 11.1 Phased plan

1. **Phase A — Heuristic bot.** Plays legally, runs near-optimal routes, makes defensible heuristic stock decisions. Beats first-time players, loses to competent humans.
2. **Phase B — LLM-augmented bot.** Heuristic bot delegates strategic decisions (par price, dump/hold, private prioritization) to an LLM with the rules in its system prompt. Tactical decisions stay deterministic.
3. **Phase C (maybe) — MCTS for tactical sub-problems** (route choice with multiple trains, train-buy decisions). Only if Phase B is solid and we want more strength.

No claim of expert-level play. The goal is "interesting opponent" not "tournament winner."

### 11.2 Architecture

- `Bot` interface: `chooseAction(state: GameState): Promise<Action>`.
- Implementations live in `engine/src/ai/`.
- Heuristic bot is sync; LLM bot is async (network call).
- Bot is consulted by the frontend in solo games. In multiplayer-with-AI, a server-side process drives it.
- **Bots only see public state.** The engine exposes `redactState(state, forPlayer)` to enforce this — even though 18xx has very little hidden info, the discipline matters for correctness.

### 11.3 LLM tool-use loop

```
1. engine.legalActions(state)  → produces a typed, finite set of actions.
2. LLM is prompted with: state digest + legal action list + system prompt with rules.
3. LLM returns: { actionType, args, reasoning }.
4. engine.apply(state, action) — if illegal, return error to LLM, retry up to N=3.
5. After N failures, fall back to heuristic bot's choice.
```

LLM never enumerates routes (algorithmic). Never sums money (precomputed in state digest). Never picks among hundreds of options (we pre-filter to ≤10 candidates).

---

## 12. Determinism and randomness

The engine is deterministic given `(initialState, actions)`. Where randomness is needed (player order, auction order, tie-breaking), use a seeded PRNG initialized from `state.rngSeed`. Each consumption of randomness is paired with an action, so replay reproduces it exactly.

**Library:** [`seedrandom`](https://www.npmjs.com/package/seedrandom) or a small in-tree implementation. TBD.

---

## 13. Testing strategy

### 13.1 Engine tests (vitest)

- **Hundreds of unit tests** for rule helpers (`Placement.isLegal`, `Market.moveDownAfterSale`, route-revenue calculations).
- **Replay tests**: a fixture file with a sequence of actions, expected state after each. Captures real bug repros.
- **Property tests** for invariants: total cash conservation, share count conservation (always 10 shares per company), market position legal at all times.

### 13.2 Frontend tests

- Light component tests; the rules logic is in the engine. Component tests focus on rendering and DI wiring, not rules.
- E2E (Playwright) tests for the critical flows: start a game, lay a tile, run a route, finish a stock round.

### 13.3 Backend tests

- RSpec for endpoints and models. Light — server is a dumb pipe.

---

## 14. Build order

Each item is its own slice. **Don't start the next one until the previous one has tests and is committed.** Each slice is a fresh chat with this spec attached.

1. **Repo skeleton.** Workspaces, vitest, Angular `ng new`, lint config, root README. No game logic.
2. **Coordinate utilities + edge math.** `engine/src/coords/` with full unit tests. This is the foundation.
3. **Map manifest.** Type the `HexSlot` discriminated union, port `chesapeake-be/db/seeds/map_hexes.json` to a typed TS module with axial coords assigned. Visual check: render an empty board.
4. **Tile catalog + tile renderer (teaching slice).** Type `TileDef`, port the existing tile data, build the `app-hex` + `app-tile` components. Render every catalog tile in a "tile gallery" page. Visually match the existing static SVGs.
5. **Initial game state.** `initialState({players, seed})` returns a populated `GameState` with starting tile placements, bank cash, IPO shares, train supply, etc. Renders the starting board.
6. **Private company auction.** First real action loop. Add the `Action` base + `BidAction` + `PassAction` + auction state machine.
7. **Stock rounds.** Buy/sell shares, par, presidency changes, market movement. Lots of tests.
8. **Operating rounds — track lay.** `LayTileAction`, placement legality (rules helpers), upgrade rules, terrain costs.
9. **Operating rounds — station markers.** `PlaceStationAction` + reachability check.
10. **Operating rounds — routes & revenue.** Graph build, route enumeration with constraints, revenue calculation. Teaching slice.
11. **Operating rounds — dividends + train buy + emergency raising + train rusting.** Phase progression hooked here.
12. **End game.** Bank break, train rusting cascades, final score.
13. **Backend.** Auth, games table, action submission, ActionCable, snapshot endpoint.
14. **Multiplayer wiring.** Lobby, join/start, live action sync.
15. **AI: heuristic bot.** Phase A.
16. **AI: LLM augmentation.** Phase B.
17. **Polish phase.** Theme, animations, sounds, drag-and-drop refinement, mobile considerations.

---

## 15. Open questions / decisions deferred

These will be addressed in their own slices when relevant:

- **Tile upgrade table** — manually transcribed or derived. Slice 8.
- **Specific terrain costs** for water/mountain — pulled from rulebook in slice 8.
- **Off-board revenue connections** that depend on path through the hex — slice 10.
- **2-player variant rules** — deferred until base game works.
- **Internationalization** — out of scope for v1.
- **Mobile responsive** — out of scope for v1.
- **Multi-game support (other 18xx titles like 18NY, 1830).** Deferred. Architectural seams kept generic — game data lives in `engine/src/data/` (not scattered through code), public engine surface (`apply`, `initialState`, `legalActions`) is game-agnostic, no `"chesapeake"` strings baked into core logic. But no plugin/`GameRules` interface is built until a second game is real; the right abstraction emerges from the second concrete case, not speculation. When/if it happens, the natural refactor is to restructure into `engine/src/games/{18chesapeake,18ny}/` and pull game-specific code behind a `GameRules` interface.

---

## 16. Reference materials

These already live in the repo and are the canonical references for any rules question. Agents are expected to consult them directly rather than asking the developer to paste rule text.

- **`resources/rules.pdf`** — the full 18Chesapeake rulebook (16 pages). The Cursor `Read` tool extracts text from it cleanly; the table of contents maps section numbers to topics (e.g. §10.4 = "Buying Stock", §11.5 = "Run Trains"). When implementing any rule-bound logic, **read the relevant section of the PDF first** and quote the exact wording in code comments or commit messages where ambiguity matters. Do not paraphrase from memory.
- **`resources/rules.html` + `resources/rules_files/`** — a frame-based HTML mirror of the same rulebook with images. Useful for cross-checking layout but text is mostly CSS-laden; prefer the PDF for textual lookup.
- **`resources/static-board.html`** — the canonical board layout as SVG. Source of truth for hex positions, off-board destinations, and pre-printed tile placements. Coordinate values here can be ported directly into the map manifest.
- **`resources/board.webp`** — the printed board image. Useful as a visual reference when reasoning about geometry, terrain, or labels.
- **Previous attempt at `/Users/cory/Desktop/dev/18ai/`** and **backend at `/Users/cory/Desktop/dev/chesapeake-be/`** — abandoned but contain useful seed data (especially `chesapeake-be/db/seeds/`) that we will port into the typed catalogs. Not source-of-truth; treat as inspiration.
- **External references that are appropriate to consult:**
  - [Red Blob Games — Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) — for any coordinate math.
  - [`tobymao/18xx`](https://github.com/tobymao/18xx) on GitHub — Ruby/Opal implementation of dozens of 18xx games including 18Chesapeake. When stuck on a rule edge case or tile/upgrade detail, this is the de-facto reference implementation. We're not porting it line-for-line, but it has solved every interesting problem already.

**Conceptual debt to `tobymao/18xx`:** several architectural patterns in this spec are convergent with theirs — the action-log-as-source-of-truth, the tile manifest with edge-indexed paths and city stops, phase-indexed off-board revenue, the `(state, action) → state` reducer shape. These weren't ported from their source code (we're TypeScript + Angular, they're Ruby + Snabberb), but the data shapes are convergent because the 18xx domain itself dictates them. Where this spec diverges (TypeScript discriminated unions vs. Ruby class inheritance for game variants; pure-functional reducer vs. OOP mutation; client-authoritative vs. server-authoritative; LLM-augmented bots) is intentional and documented inline. When in doubt about a rule edge case, their implementation is the de-facto community reference. This attribution should also appear in the project README when it's created (slice 1).

**Rule:** no rule logic is implemented from memory. Cite the PDF section in the commit message or code comment.

## 17. Working agreement (AI assistant ↔ developer)

Captured here so it survives context resets:

1. **One slice per chat.** Start a fresh chat for each item in §14. Re-attach this spec.
2. **Opus for design, Auto for execution.** Design slices and gnarly debugging in Opus; mechanical work and tests in Auto.
3. **Teaching mode** for: tile rendering (slice 4), route enumeration (slice 10), AI architecture (slice 15). Walk through the algorithm before writing code.
4. **No black boxes.** If the developer doesn't understand a piece of code, it's the AI's job to explain it.
5. **Tests before merging.** Engine slices land with tests. Always.
6. **Consult the rulebook.** When implementing rule logic, read the relevant section of `resources/rules.pdf` (see §16). Don't work from memory.
7. **Push back on bad ideas.** Both directions. The AI explains its reasoning; the developer can override but should know what they're trading.
8. **Update this doc** when a decision changes. Don't let the spec drift from reality.
9. **Rule ambiguities** get logged in `docs/rules-decisions.md` with the chosen interpretation and rationale, not silently coded.
