import type { ComponentType } from 'react';
import type { JunctionConfig, ModuleConfig } from './shared-config';
import type { Alert } from '../lib/shared-simulation';

// ---------------------------------------------------------------------------
// Base types — all supported locations
// ---------------------------------------------------------------------------

export type BaseType = 'moon' | 'mars' | 'titan' | 'europa' | 'ceres' | 'venus' | 'phobos';

// ---------------------------------------------------------------------------
// Bookmark type (camera presets)
// ---------------------------------------------------------------------------

export type Bookmark = {
  name: string;
  target: [number, number, number];
  offset: [number, number, number];
};

// ---------------------------------------------------------------------------
// Facility detail renderer signature
// ---------------------------------------------------------------------------

export type FacilityDetailRenderer = ComponentType<{
  facilityId: string;
  onClose: () => void;
  facilities: unknown;
}>;

// ---------------------------------------------------------------------------
// Base registry entry — everything that varies per base
// ---------------------------------------------------------------------------

export interface BaseRegistryEntry {
  type: BaseType;
  name: string;          // e.g., 'ARTEMIS BASE'
  subtitle: string;      // e.g., 'Luna'
  bgColor: string;       // Canvas background color

  // Layout
  junctions: JunctionConfig[];
  modules: ModuleConfig[];

  // Simulation
  createInitialState: () => Record<string, unknown>;
  tick: (state: unknown) => { state: Record<string, unknown>; newAlerts?: Alert[] };

  // Camera
  bookmarks: Bookmark[];

  // Alerts
  systemMap: Record<string, string>;
  facilityPositions: Record<string, [number, number, number]>;
  viewpointLabels: string[];

  // Scene component (lazy — set after import)
  Scene: ComponentType;

  // Extra sidebar panels (rendered conditionally)
  leftPanels?: ComponentType[];
  rightPanels?: ComponentType[];

  // Facility detail panel renderer
  FacilityDetail?: FacilityDetailRenderer;

  // Planet/orbital view scene
  PlanetScene?: ComponentType;

  // Subviews (remote outposts, etc.)
  subviews?: SubviewConfig[];
}

// ---------------------------------------------------------------------------
// Subview config — sub-locations near a base
// ---------------------------------------------------------------------------

export interface SubviewConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  Scene: ComponentType;
  bookmarks: Bookmark[];
  junctions?: JunctionConfig[];
  modules?: ModuleConfig[];
}

// ---------------------------------------------------------------------------
// Registry — populated by each base's registration call
// ---------------------------------------------------------------------------

const registry = new Map<BaseType, BaseRegistryEntry>();

export function registerBase(entry: BaseRegistryEntry) {
  registry.set(entry.type, entry);
}

export function getBaseEntry(type: BaseType): BaseRegistryEntry {
  const entry = registry.get(type);
  if (!entry) throw new Error(`Base "${type}" not registered`);
  return entry;
}

export function getAllBases(): BaseRegistryEntry[] {
  return Array.from(registry.values());
}
