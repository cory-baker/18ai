import { describe, expect, it } from 'vitest';
import type { CityHexSlot, OffboardHexSlot } from '../../src/types/map-types.js';
import { getAxialFromHexId, getHexIdFromAxial, Map as ChesapeakeMap } from '../../src/index.js';

describe('data/map manifest', () => {
  it('has one entry per Chesapeake board hex from 18xx map.rb (63 total)', () => {
    expect(ChesapeakeMap.map.length).toBe(63);
  });

  it('round-trips every board-style hex id through axial coords', () => {
    for (const h of ChesapeakeMap.map) {
      expect(getHexIdFromAxial(getAxialFromHexId(h.id))).toBe(h.id);
    }
  });

  it('marks F-8 as Washington DC city', () => {
    const f8 = ChesapeakeMap.map.find((h): h is CityHexSlot => h.id === 'F-8' && h.kind === 'city');
    expect(f8).toBeDefined();
    if (!f8) {
      throw new Error('expected F-8 city hex');
    }
    expect(f8.label).toBe('DC');
    expect(f8.name).toBe('Washington DC');
  });

  it('marks H-6 as OO Baltimore with initial tile and B&O home', () => {
    const h6 = ChesapeakeMap.map.find((h): h is CityHexSlot => h.id === 'H-6' && h.kind === 'city');
    expect(h6).toBeDefined();
    if (!h6) {
      throw new Error('expected H-6 city hex');
    }
    expect(h6.label).toBe('OO');
    expect(h6.initialTileId).toBe('H6_initial');
    expect(h6.homeFor).toBe('B&O');
  });

  it('gives Pittsburgh (B-2) yellow-phase revenue 40', () => {
    const pit = ChesapeakeMap.map.find((h): h is OffboardHexSlot => h.id === 'B-2' && h.kind === 'offboard');
    expect(pit).toBeDefined();
    if (!pit) {
      throw new Error('expected B-2 offboard hex');
    }
    expect(pit.revenueByPhase.yellow).toBe(40);
  });

  it('uses unique ids', () => {
    const ids = ChesapeakeMap.map.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
