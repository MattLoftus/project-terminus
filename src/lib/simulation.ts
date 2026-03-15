// Barrel re-export — all existing imports from 'simulation' continue to work
export * from './shared-simulation';
export { createMoonInitialState as createInitialState, moonTick as tick } from './moon-simulation';
