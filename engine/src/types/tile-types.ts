import type { TileStop, Path } from '../types/map-types.js';

export type TileColor = 'yellow' | 'green' | 'brown' | 'gray';

export type Rotation = 0 | 1 | 2 | 3 | 4 | 5;

export interface TileDef {
  id: string;
  color: TileColor;
  quantity: number;
  stops: TileStop[];
  paths: Path[];
  label?: 'B' | 'OO' | 'DC';
}
