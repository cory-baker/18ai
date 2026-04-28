import { describe, expect, it } from 'vitest';
import { EDGE_NAMES, Edge, edgeName, oppositeEdge, parseEdge, rotateEdge } from '../src/index.js';

describe('coords/edges', () => {
  const EDGE_IDS = [0, 1, 2, 3, 4, 5] as const;

  it('exposes canonical edge constants in flat-top clockwise order', () => {
    expect(Edge).toEqual({
      N: 0,
      NE: 1,
      SE: 2,
      S: 3,
      SW: 4,
      NW: 5,
    });
    expect(EDGE_NAMES).toEqual(['N', 'NE', 'SE', 'S', 'SW', 'NW']);
  });

  it('round-trips edge ids and names', () => {
    for (const edgeId of EDGE_IDS) {
      const edge = EDGE_NAMES[edgeId];
      expect(edgeName(edgeId)).toBe(edge);
      expect(parseEdge(edge)).toBe(edgeId);
    }
  });

  it('rotates edges clockwise and supports negative rotation', () => {
    expect(rotateEdge(Edge.N, 0)).toBe(Edge.N);
    expect(rotateEdge(Edge.N, 1)).toBe(Edge.NE);
    expect(rotateEdge(Edge.N, 6)).toBe(Edge.N);
    expect(rotateEdge(Edge.N, -1)).toBe(Edge.NW);
    expect(rotateEdge(Edge.SW, -8)).toBe(Edge.SE);
  });

  it('returns opposite edges', () => {
    expect(oppositeEdge(Edge.N)).toBe(Edge.S);
    expect(oppositeEdge(Edge.NE)).toBe(Edge.SW);
    expect(oppositeEdge(Edge.SE)).toBe(Edge.NW);
  });
});
