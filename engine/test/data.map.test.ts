import { describe, expect, it } from 'vitest';
import { HexId, Map } from '../src/index.js';

describe('data/map manifest', () => {
  it('has one entry per Chesapeake board hex from 18xx map.rb (63 total)', () => {
    expect(Map.map.length).toBe(63);
  });

  it('round-trips every board-style hex id through axial coords', () => {
    for (const h of Map.map) {
      expect(HexId.getHexIdFromAxial(HexId.getAxialFromHexId(h.id))).toBe(h.id);
    }
  });

  it('marks F-8 as Washington DC city', () => {
    const f8 = Map.map.find((h) => h.id === 'F-8');
    expect(f8?.kind).toBe('city');
    if (f8?.kind === 'city') {
      expect(f8.label).toBe('DC');
      expect(f8.name).toBe('Washington DC');
    }
  });

  it('marks H-6 as OO Baltimore with initial tile and B&O home', () => {
    const h6 = Map.map.find((h) => h.id === 'H-6');
    expect(h6?.kind).toBe('city');
    if (h6?.kind === 'city') {
      expect(h6.label).toBe('OO');
      expect(h6.initialTileId).toBe('H6_initial');
      expect(h6.homeFor).toBe('B&O');
    }
  });

  it('gives Pittsburgh (B-2) yellow-phase revenue 40', () => {
    const pit = Map.map.find((h) => h.id === 'B-2' && h.kind === 'offboard');
    expect(pit?.kind).toBe('offboard');
    if (pit?.kind === 'offboard') {
      expect(pit.revenueByPhase.yellow).toBe(40);
    }
  });

  it('uses unique ids', () => {
    const ids = Map.map.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
