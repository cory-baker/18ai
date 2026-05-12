import { HexId } from '../coords/hex-id.js';
import type { HexSlot, HexSlotWithoutCoords } from './map-types.js';
import { MAP_MANIFEST_SEED } from './map-manifest-seed.js';

/** Chesapeake board manifest: hex slots with axial coords derived from each `id`. */
export class Map {
  static hydrateHexCoords(row: HexSlotWithoutCoords): HexSlot {
    const { q, r } = HexId.getAxialFromHexId(row.id);
    return { ...row, q, r };
  }

  static readonly map: readonly HexSlot[] = MAP_MANIFEST_SEED.map((row) => Map.hydrateHexCoords(row));
}
