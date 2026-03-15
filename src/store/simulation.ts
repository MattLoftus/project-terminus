import { create } from 'zustand';
import type { BaseType } from '../data/base-registry';
import { getBaseEntry } from '../data/base-registry';
import type { SimulationState } from '../lib/shared-simulation';

export type { BaseType } from '../data/base-registry';

// The store holds generic state — each base's createInitialState/tick handles specifics
interface SimulationStore extends Omit<SimulationState, 'facilities'> {
  baseType: BaseType;
  facilities: Record<string, unknown>;
  [key: string]: unknown;
  switchBase: (type: BaseType) => void;
  hoveredModule: string | null;
  setHoveredModule: (id: string | null) => void;
  focusTarget: [number, number, number] | null;
  setFocusTarget: (pos: [number, number, number] | null) => void;
  selectedModule: string | null;
  setSelectedModule: (id: string | null) => void;
  viewMode: 'base' | 'planet';
  setViewMode: (mode: 'base' | 'planet') => void;
  activeSubview: string | null;
  setActiveSubview: (id: string | null) => void;
  isPaused: boolean;
  simSpeed: number;
  togglePause: () => void;
  setSimSpeed: (speed: number) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  isTransitioning: boolean;
  transitionTarget: BaseType | null;
  beginTransition: (target: BaseType) => void;
  completeTransition: () => void;
  tick: () => void;
  _initialized: boolean;
}

function initializeBase(type: BaseType) {
  const entry = getBaseEntry(type);
  return { baseType: type, ...entry.createInitialState(), _initialized: true };
}

export const useSimulation = create<SimulationStore>((set, get) => ({
  // Placeholder state — real init happens via ensureInitialized() or switchBase()
  baseType: 'moon' as BaseType,
  _initialized: false,
  missionDay: 0,
  missionTime: 0,
  modules: [],
  alerts: [],
  atmosphere: { pressure: 0, o2: 0, co2: 0, humidity: 0 },
  power: { solarGeneration: 0, batteryLevel: 0, consumption: 0 },
  water: { reserves: 0, recyclingRate: 0, dailyConsumption: 0 },
  crew: { total: 0, evaActive: 0, medicalAlerts: 0 },
  crewRoster: [],
  comms: { earthLink: false, signalLatency: 0, bandwidth: 0 },
  radiation: { external: 0, shieldStatus: false },
  facilities: {} as Record<string, unknown>,
  switchBase: (type) => {
    stopSimulation();
    const entry = getBaseEntry(type);
    const initialState = entry.createInitialState();
    set({ baseType: type, ...initialState, _initialized: true, hoveredModule: null, focusTarget: null, selectedModule: null, viewMode: 'base' as const, activeSubview: null, isPaused: false });
    startSimulation();
  },
  hoveredModule: null,
  setHoveredModule: (id) => set({ hoveredModule: id }),
  focusTarget: null,
  setFocusTarget: (pos) => set({ focusTarget: pos }),
  selectedModule: null,
  setSelectedModule: (id) => set({ selectedModule: id }),
  viewMode: 'base' as const,
  setViewMode: (mode) => set({ viewMode: mode }),
  activeSubview: null,
  setActiveSubview: (id) => set({ activeSubview: id }),
  isPaused: false,
  simSpeed: 1,
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  audioEnabled: false,
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  isTransitioning: false,
  transitionTarget: null,
  beginTransition: (target) => set({ isTransitioning: true, transitionTarget: target }),
  completeTransition: () => {
    const { transitionTarget, switchBase } = get();
    if (transitionTarget) {
      switchBase(transitionTarget);
    }
    set({ isTransitioning: false, transitionTarget: null });
  },
  tick: () =>
    set((state) => {
      if (!state._initialized) return {};
      const entry = getBaseEntry(state.baseType);
      const { state: newState } = entry.tick(state);
      return newState;
    }),
}));

/** Call after registry is populated to set up initial Moon state */
export function ensureInitialized() {
  const state = useSimulation.getState();
  if (!state._initialized) {
    useSimulation.setState(initializeBase('moon'));
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSimulation(intervalMs: number = 2000) {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const { isPaused } = useSimulation.getState();
    if (!isPaused) {
      useSimulation.getState().tick();
    }
  }, intervalMs);
}

export function stopSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Restart simulation with a new interval (used by speed controls) */
export function restartSimulation(intervalMs: number) {
  stopSimulation();
  startSimulation(intervalMs);
}
