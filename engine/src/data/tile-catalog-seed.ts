import type { TileDef } from '../types/tile-types.js';

export const TILE_CATALOG_SEED: readonly TileDef[] = [
  { id: '9', color: 'yellow', quantity: -1, stops: [], paths: [{ kind: 'edge-to-edge', edgeA: 0, edgeB: 3 }] },
  {
    id: '57',
    color: 'yellow',
    quantity: 7,
    stops: [{ indexOnTile: 0, kind: 'city', stationMarkerCapacity: 1, revenue: 20 }],
    paths: [
      { kind: 'edge-to-stop', edge: 0, stopIndex: 0 },
      { kind: 'edge-to-stop', edge: 3, stopIndex: 0 },
    ],
  },
];
