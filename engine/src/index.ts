export const ENGINE_VERSION = '0.0.0' as const;

export interface EnginePlaceholder {
  readonly version: typeof ENGINE_VERSION;
  readonly message: string;
}

export function enginePlaceholder(): EnginePlaceholder {
  return {
    version: ENGINE_VERSION,
    message: '@18ai/engine wired up — slice 1 toolchain verified.',
  };
}

export type { AxialHex, EdgeId } from './coords/index.js';
export {
  EDGE_NAMES,
  Edge,
  areMutualNeighbors,
  areNeighbors,
  edgeBetween,
  edgeName,
  hexDistance,
  neighborOf,
  oppositeEdge,
  parseEdge,
  rotateEdge,
} from './coords/index.js';
