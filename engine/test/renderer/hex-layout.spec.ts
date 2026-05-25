import { Edge, HexLayout, Tiles } from '../../src/index.js';
import { describe, expect, it } from 'vitest';

describe('hex-layout', () => {
  it('calculates the midpoint of an edge', () => {
    expect(HexLayout.edgeMidpoint(Edge.N)).toEqual({ x: 0, y: -87 });
    expect(HexLayout.edgeMidpoint(Edge.S)).toEqual({ x: 0, y: 87 });
  });
});
