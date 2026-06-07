import type { TileDef } from '../types/tile-types.js';
import { TILE_CATALOG_SEED } from './tile-catalog-seed.js';

export class Tiles {
  static readonly catalog: readonly TileDef[] = TILE_CATALOG_SEED;

  private static readonly byIdMap = new Map(Tiles.catalog.map((t) => [t.id, t]));

  static byId(id: string): TileDef | undefined {
    return Tiles.byIdMap.get(id);
  }
}
