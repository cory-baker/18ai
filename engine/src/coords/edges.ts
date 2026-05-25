import type { EdgeId } from './types.js';

export const Edge = {
  N: 0,
  NE: 1,
  SE: 2,
  S: 3,
  SW: 4,
  NW: 5,
} as const satisfies Record<'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW', EdgeId>;

export const EDGE_NAMES = ['N', 'NE', 'SE', 'S', 'SW', 'NW'] as const;

type EdgeName = (typeof EDGE_NAMES)[number];

export function edgeName(edge: EdgeId): EdgeName {
  return EDGE_NAMES[edge];
}

export function parseEdge(name: EdgeName): EdgeId {
  const edge = EDGE_NAMES.indexOf(name);
  if (edge < 0) {
    throw new Error(`Unknown edge name: ${name}`);
  }

  return edge as EdgeId;
}

export function rotateEdge(edge: EdgeId, rotations: number): EdgeId {
  return ((((edge + rotations) % 6) + 6) % 6) as EdgeId;
}

export function oppositeEdge(edge: EdgeId): EdgeId {
  return ((edge + 3) % 6) as EdgeId;
}
