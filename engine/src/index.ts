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
export { EDGE_MIDPOINTS, HEX_HEIGHT, HEX_RADIUS, POLY_POINTS, cityCenter, edgeMidpoint, hexToPixel, segmentForPath, stopCenter } from './render/hex-layout.js';
export type { PixelPoint, Segment } from './render/hex-layout.js';
export type { AxialHex, EdgeId } from './coords/types.js';
export { EDGE_NAMES, Edge, edgeName, oppositeEdge, parseEdge, rotateEdge } from './coords/edges.js';
export { areMutualNeighbors, areNeighbors, edgeBetween, hexDistance, neighborOf } from './coords/axial.js';
export { getAxialFromHexId, getColIdFromColIdx, getColIdxFromColId, getHexIdFromAxial, getPartsFromHexId, getRowIdFromRowIdx, getRowIdxFromRowId } from './coords/hex-id.js';
export type { HexSlot, HexSlotWithoutCoords, HexSlotBase, OpenHexSlot, CityHexSlot, TownHexSlot, OffboardHexSlot, StaticTrackHexSlot, Path, EdgeToEdgePath, EdgeToStopPath, TileStop as CityStop } from './types/map-types.js';
export type { CompanyId } from './types/company-id.js';
export { Map } from './data/map.js';
export type { TileDef, TileColor, Rotation } from './types/tile-types.js';
export { Tiles } from './data/tiles.js';
