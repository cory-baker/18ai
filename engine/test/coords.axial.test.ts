import { describe, expect, it } from 'vitest';
import {
  Edge,
  areMutualNeighbors,
  areNeighbors,
  edgeBetween,
  hexDistance,
  neighborOf,
} from '../src/index.js';

describe('coords/axial', () => {
  it('computes flat-top neighbors for each edge', () => {
    const origin = { q: 0, r: 0 };

    expect(neighborOf(origin, Edge.N)).toEqual({ q: 0, r: -1 });
    expect(neighborOf(origin, Edge.NE)).toEqual({ q: 1, r: -1 });
    expect(neighborOf(origin, Edge.SE)).toEqual({ q: 1, r: 0 });
    expect(neighborOf(origin, Edge.S)).toEqual({ q: 0, r: 1 });
    expect(neighborOf(origin, Edge.SW)).toEqual({ q: -1, r: 1 });
    expect(neighborOf(origin, Edge.NW)).toEqual({ q: -1, r: 0 });
  });

  it('computes axial hex distance', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(hexDistance({ q: -3, r: 2 }, { q: 2, r: -1 })).toBe(5);
  });

  it('detects neighbor relationships and determines shared edge', () => {
    const a = { q: 2, r: -1 };
    const b = { q: 3, r: -1 };
    const far = { q: 4, r: -1 };

    expect(areNeighbors(a, b)).toBe(true);
    expect(areNeighbors(a, far)).toBe(false);
    expect(edgeBetween(a, b)).toBe(Edge.SE);
    expect(edgeBetween(a, far)).toBeNull();
  });

  it('ensures mutual-neighbor consistency using opposite edges', () => {
    const a = { q: 0, r: 0 };
    const b = { q: 1, r: -1 };
    const c = { q: 2, r: -2 };

    expect(areMutualNeighbors(a, b)).toBe(true);
    expect(areMutualNeighbors(a, c)).toBe(false);
  });
});
