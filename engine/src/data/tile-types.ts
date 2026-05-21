import type { CityStop, Path } from './map-types.js';

export type TileColor = 'yellow' | 'green' | 'brown' | 'gray';

export interface TileDef {
  id: string;
  color: TileColor;
  quantity: number;
  cities: CityStop[];
  paths: Path[];
  label?: 'B' | 'OO' | 'DC';
}
