import { oppositeEdge } from './edges.js';
import type { AxialHex, EdgeId } from './types.js';

const NEIGHBOR_DELTAS: Readonly<Record<EdgeId, AxialHex>> = {
  0: { q: 0, r: -1 }, // N
  1: { q: 1, r: -1 }, // NE
  2: { q: 1, r: 0 }, // SE
  3: { q: 0, r: 1 }, // S
  4: { q: -1, r: 1 }, // SW
  5: { q: -1, r: 0 }, // NW
};

export const neighborOf = (hex: AxialHex, edge: EdgeId): AxialHex => ({
  q: hex.q + NEIGHBOR_DELTAS[edge].q,
  r: hex.r + NEIGHBOR_DELTAS[edge].r,
});

export const hexDistance = (a: AxialHex, b: AxialHex): number => {
  const dq = a.q - b.q;
  const dr = a.r - b.r;

  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};

export const areNeighbors = (a: AxialHex, b: AxialHex): boolean => hexDistance(a, b) === 1;

export const edgeBetween = (from: AxialHex, to: AxialHex): EdgeId | null => {
  for (let edge = 0 as EdgeId; edge < 6; edge = (edge + 1) as EdgeId) {
    const candidate = neighborOf(from, edge);
    if (candidate.q === to.q && candidate.r === to.r) {
      return edge;
    }
  }

  return null;
};

export const areMutualNeighbors = (a: AxialHex, b: AxialHex): boolean => {
  const edge = edgeBetween(a, b);
  if (edge === null) {
    return false;
  }

  const backNeighbor = neighborOf(b, oppositeEdge(edge));
  return backNeighbor.q === a.q && backNeighbor.r === a.r;
};
