// Barrel re-export — all existing imports from 'base-config' continue to work
export {
  type Direction,
  type JunctionConfig,
  type ModuleConfig,
  type SystemStatus,
  JUNCTION_RADIUS,
  HALLWAY_PAD,
  DEAD_END_LENGTH,
  getStatusColor,
  directionVector,
} from './shared-config';
export { junctions, modules } from './moon-config';

// Backward-compatible wrapper: getModulePlacement with moon junctions pre-bound
import { getModulePlacement as _getModulePlacement } from './shared-config';
import { junctions } from './moon-config';
import type { ModuleConfig } from './shared-config';

export const getModulePlacement = (mod: ModuleConfig) => _getModulePlacement(mod, junctions);
