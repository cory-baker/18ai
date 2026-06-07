import type { AxialHex, EdgeId } from '../coords/types.js';
import type { CityStop, Path, PathEnd } from '../types/map-types.js';

export const HEX_RADIUS = 100;
export const HEX_HEIGHT = HEX_RADIUS * Math.sqrt(3); // https://www.redblobgames.com/grids/hexagons/#spacing
export const POLY_POINTS = `100,0 50,87 -50,87 -100,0 -50,-87 50,-87`; // https://www.redblobgames.com/grids/hexagons/#angles

export interface PixelPoint {
  x: number;
  y: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const EDGE_MIDPOINTS: Readonly<Record<EdgeId, PixelPoint>> = {
  0: { x: 0, y: -87 }, // M_0 = (0, -R√3/2)     N
  1: { x: 75, y: -43 }, // M_1 = (3R/4, -R√3/4)  NE
  2: { x: 75, y: 43 }, // M_2 = (3R/4,  R√3/4)  SE
  3: { x: 0, y: 87 }, // M_3 = (0,  R√3/2)     S
  4: { x: -75, y: 43 }, // M_4 = (-3R/4, R√3/4)  SW
  5: { x: -75, y: -43 }, // M_5 = (-3R/4, -R√3/4) NW
};

// https://www.redblobgames.com/grids/hexagons/#hex-to-pixel-axial
export function hexToPixel(h: AxialHex): PixelPoint {
  return {
    x: 1.5 * HEX_RADIUS * h.q,
    y: HEX_HEIGHT * (h.r + h.q / 2),
  };
}

export function edgeMidpoint(edge: EdgeId): PixelPoint {
  return EDGE_MIDPOINTS[edge];
}

export function cityCenter(_stop: CityStop): PixelPoint {
  return { x: 0, y: 0 };
}

export function resolvePathEnd(end: PathEnd, cities: readonly CityStop[]): PixelPoint {
  if (end.kind === 'edge') {
    return edgeMidpoint(end.edge);
  }
  const stop = cities.find((c) => c.id === end.stopId);
  return stop ? cityCenter(stop) : { x: 0, y: 0 };
}

export function segmentForPath(path: Path, cities: readonly CityStop[]): Segment {
  const from = resolvePathEnd(path.from, cities);
  const to = resolvePathEnd(path.to, cities);
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}
