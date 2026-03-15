import type { SystemStatus } from '../data/shared-config';
import type { CrewMember } from './crew';

export interface AtmosphereData {
  pressure: number;     // kPa, nominal ~101.3
  o2: number;           // %, nominal ~21
  co2: number;          // ppm, nominal <1000
  humidity: number;     // %, nominal 40-60
}

export interface WaterData {
  reserves: number;     // liters, nominal ~50000
  recyclingRate: number; // %, nominal ~94
  dailyConsumption: number; // L/day, nominal ~200
}

export interface PowerData {
  solarGeneration: number; // kW, nominal ~120
  batteryLevel: number;    // %, nominal ~85
  consumption: number;     // kW, nominal ~95
}

export interface CommsData {
  earthLink: boolean;
  signalLatency: number;   // seconds, nominal ~1.3
  bandwidth: number;       // Mbps, nominal ~10
}

export interface CrewData {
  total: number;
  evaActive: number;
  medicalAlerts: number;
}

export interface RadiationData {
  external: number;        // mSv/hr, nominal ~0.5
  shieldStatus: boolean;
}

export interface ModuleStatus {
  id: string;
  status: SystemStatus;
  temperature: number;     // C, nominal 20-22
}

export interface ReactorData {
  coreTemp: number;
  outputKW: number;
  rodStatus: 'inserted' | 'withdrawn' | 'partial';
  coolantFlow: number;
  status: SystemStatus;
}

export interface ISRUData {
  throughput: number;
  regolithProcessed: number;
  o2ProductionRate: number;
  h2oProductionRate: number;
  hopperStatus: 'running' | 'jammed' | 'idle';
  status: SystemStatus;
}

export interface LaunchPadData {
  id: string;
  fuelLevel: number;
  padStatus: 'occupied' | 'empty' | 'fueling' | 'launch-prep';
  status: SystemStatus;
}

export interface FacilitiesData {
  reactor: ReactorData;
  isru: ISRUData;
  launchPads: LaunchPadData[];
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: SystemStatus;
  message: string;
  system: string;
}

export interface SimulationState {
  missionDay: number;
  missionTime: number; // seconds since midnight
  atmosphere: AtmosphereData;
  water: WaterData;
  power: PowerData;
  comms: CommsData;
  crew: CrewData;
  crewRoster: CrewMember[];
  radiation: RadiationData;
  modules: ModuleStatus[];
  facilities: FacilitiesData;
  alerts: Alert[];
}

// Gaussian random with Box-Muller transform
export function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Drift a value toward a target with noise
export function drift(current: number, target: number, pullStrength: number, noise: number, min: number, max: number): number {
  const pull = (target - current) * pullStrength;
  const jitter = gaussianRandom(0, noise);
  return Math.max(min, Math.min(max, current + pull + jitter));
}

export let alertCounter = 0;

export function createAlert(severity: SystemStatus, system: string, message: string, missionDay: number, missionTime: number): Alert {
  return {
    id: `alert-${++alertCounter}`,
    timestamp: missionDay * 86400 + missionTime,
    severity,
    message,
    system,
  };
}

export function formatMissionTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function getSystemStatus(state: SimulationState): SystemStatus {
  const hasAnyCritical = state.modules.some(m => m.status === 'critical');
  const hasAnyWarning = state.modules.some(m => m.status === 'warning');
  if (hasAnyCritical) return 'critical';
  if (hasAnyWarning) return 'warning';
  return 'nominal';
}
