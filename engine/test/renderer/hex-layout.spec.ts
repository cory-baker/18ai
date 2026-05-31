import { Edge, edgeMidpoint, segmentForPath, Tiles } from '../../src/index.js';
import { describe, expect, it } from 'vitest';

describe('hex-layout', () => {
  describe('edgeMidpoint', () => {
    it('calculates the midpoint of an edge', () => {
      expect(edgeMidpoint(Edge.N)).toEqual({ x: 0, y: -87 });
      expect(edgeMidpoint(Edge.S)).toEqual({ x: 0, y: 87 });
    });
  });

  describe('segmentForPath', () => {
    it('returns a vertical line for tile #9 N -> S path', () => {
      const tile9 = Tiles.byId('9')!;
      const seg = segmentForPath(tile9.paths[0]!, tile9.cities);
      expect(seg).toEqual({ x1: 0, y1: -87, x2: 0, y2: 87 });
    });
  });
});
