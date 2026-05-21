import { describe, expect, it } from 'vitest';
import { Tiles } from '../src/data/tiles.js';

describe('data/tiles catalog', () => {
  it('exposes yellow tile 9 with unlimited quantity', () => {
    const t = Tiles.byId('9');
    expect(t).toBeDefined();
    expect(t!.color).toBe('yellow');
    expect(t!.quantity).toBe(-1);
    expect(t!.paths.length).toBeGreaterThanOrEqual(1);
  });

  it('looks up tiles by id', () => {
    expect(Tiles.byId('missing')).toBeUndefined();
  });
});
