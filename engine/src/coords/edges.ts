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

export const edgeName = (edge: EdgeId): EdgeName => EDGE_NAMES[edge];

export const parseEdge = (name: EdgeName): EdgeId => {
  const edge = EDGE_NAMES.indexOf(name);
  if (edge < 0) {
    throw new Error(`Unknown edge name: ${name}`);
  }

  return edge as EdgeId;
};

export const rotateEdge = (edge: EdgeId, rotations: number): EdgeId =>
  ((((edge + rotations) % 6) + 6) % 6) as EdgeId;

export const oppositeEdge = (edge: EdgeId): EdgeId => ((edge + 3) % 6) as EdgeId;
