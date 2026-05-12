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

export type HexSlot =
  | OpenHexSlot
  | CityHexSlot
  | TownHexSlot
  | OffboardHexSlot
  | StaticTrackHexSlot;

/** Map manifest row: same as `HexSlot` but axial coords are filled at load from `id`. */
export type HexSlotWithoutCoords = HexSlot extends infer H ? (H extends HexSlot ? Omit<H, 'q' | 'r'> : never) : never;

export interface CityStop {
  id: number;
  kind: 'city' | 'town';
  slots: number;
  revenue: number;
}

export interface Path {
  a: PathEnd;
  b: PathEnd;
}

export type PathEnd =
  | { kind: 'edge'; edge: EdgeId }
  | { kind: 'stop'; stopId: number };
