import type { EdgeId } from '../coords/types.js';
import type { CompanyId } from './company-id.js';

export interface HexSlotBase {
  id: string;
  q: number;
  r: number;
  name?: string;
  label?: 'B' | 'OO' | 'DC';
  terrain?: { mountain?: true; water?: true };
  upgradeCost?: number;
}

export interface OpenHexSlot extends HexSlotBase {
  kind: 'open';
}

export interface CityHexSlot extends HexSlotBase {
  kind: 'city';
  initialTileId?: string;
  homeFor?: CompanyId;
}

export interface TownHexSlot extends HexSlotBase {
  kind: 'town';
  dits: 1 | 2;
}

export interface OffboardHexSlot extends HexSlotBase {
  kind: 'offboard';
  revenueByPhase: { yellow: number; green: number; brown: number; gray: number };
  exits: EdgeId[];
}

export interface StaticTrackHexSlot extends HexSlotBase {
  kind: 'static_track';
  paths: Path[];
}

export type HexSlot = OpenHexSlot | CityHexSlot | TownHexSlot | OffboardHexSlot | StaticTrackHexSlot;

/** Map manifest row: same as `HexSlot` but axial coords are filled at load from `id`. */
export type HexSlotWithoutCoords = HexSlot extends infer H ? (H extends HexSlot ? Omit<H, 'q' | 'r'> : never) : never;

export interface TileStop {
  indexOnTile: number;
  kind: 'city' | 'town';
  /** `0` = town (no markers). */
  stationMarkerCapacity: number;
  /** Base revenue value; phase-dependent off-board revenue uses a separate table. */
  revenue: number;
}

/** Track connecting two hex edges. */
export interface EdgeToEdgePath {
  kind: 'edge-to-edge';
  edgeA: EdgeId;
  edgeB: EdgeId;
}

/** Track connecting a hex edge to a city/town stop. */
export interface EdgeToStopPath {
  kind: 'edge-to-stop';
  edge: EdgeId;
  stopIndex: number;
}

/** Track segment on a tile; discriminated by `kind`. */
export type Path = EdgeToEdgePath | EdgeToStopPath;
