export const ENGINE_VERSION = '0.0.0' as const;

export interface EnginePlaceholder {
  readonly version: typeof ENGINE_VERSION;
  readonly message: string;
}

export function enginePlaceholder(): EnginePlaceholder {
  return {
    version: ENGINE_VERSION,
    message: '@18ai/engine wired up — slice 1 toolchain verified.',
  };
}

export type { AxialHex, EdgeId } from './coords/types.js';
export { EDGE_NAMES, Edge, edgeName, oppositeEdge, parseEdge, rotateEdge } from './coords/edges.js';
export { areMutualNeighbors, areNeighbors, edgeBetween, hexDistance, neighborOf } from './coords/axial.js';
export { HexId } from './coords/hex-id.js';
export type {
  HexSlot,
  HexSlotBase,
  OpenHexSlot,
  CityHexSlot,
  TownHexSlot,
  OffboardHexSlot,
  StaticTrackHexSlot,
  Path,
  PathEnd,
  CityStop,
} from './data/map-types.js';
export type { CompanyId } from './data/company-id.js';
