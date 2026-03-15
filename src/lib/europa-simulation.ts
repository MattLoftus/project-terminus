import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  type ReactorData,
  drift,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// --- Europa-specific interfaces ---

export interface JupiterRadiationData {
  fluxLevel: number;        // Sv/hr, orbital period ~85hr cycle. Nominal 0.5, spikes to 5+
  orbitalPhase: number;     // 0-1, position in orbital cycle
  shieldIntegrity: number;  // %, degrades during flux spikes
  shelterActive: boolean;
}

export interface IceDrillData {
  depth: number;           // meters through ice shell (target: 10000-30000m)
  drillRate: number;       // m/hr, nominal ~0.5
  bitTemp: number;         // celsius
  status: SystemStatus;
  breakthroughReached: boolean;
}

export interface OceanProbeData {
  deployed: boolean;
  descentDepth: number;    // meters below ice
  signalStrength: number;  // %, degrades with depth
  discoveryLog: string[];  // recent findings
  status: SystemStatus;
}

export interface TidalMonitorData {
  tidalStress: number;     // relative units 0-10
  quakeRisk: number;       // 0-1, probability per tick
  lastQuakeMagnitude: number;
}

export interface EuropaFacilitiesData {
  reactor: ReactorData;
  iceDrill: IceDrillData;
  oceanProbe: OceanProbeData;
  tidalMonitor: TidalMonitorData;
  radiationShield: JupiterRadiationData;
}

export interface EuropaSimulationState extends Omit<SimulationState, 'facilities'> {
  facilities: EuropaFacilitiesData;
}

// --- Initial state ---

export function createEuropaInitialState(): EuropaSimulationState {
  const initial = {
    missionDay: 89,
    missionTime: 21600, // 06:00
    atmosphere: { pressure: 101.3, o2: 21.0, co2: 490, humidity: 35 },
    water: { reserves: 45000, recyclingRate: 95, dailyConsumption: 160 },
    power: { solarGeneration: 0, batteryLevel: 85, consumption: 75 },
    comms: { earthLink: true, signalLatency: 2700, bandwidth: 1.2 }, // ~45 min
    crew: { total: 8, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.5, shieldStatus: true },
    modules: [
      { id: 'command', status: 'nominal', temperature: 20.5 },
      { id: 'comms', status: 'nominal', temperature: 19.8 },
      { id: 'lifesupport', status: 'nominal', temperature: 20.2 },
      { id: 'storage', status: 'nominal', temperature: 17.0 },
      { id: 'rad-shield', status: 'nominal', temperature: 21.0 },
      { id: 'habitation', status: 'nominal', temperature: 21.2 },
      { id: 'research', status: 'nominal', temperature: 19.5 },
      { id: 'airlock', status: 'nominal', temperature: 16.5 },
      { id: 'passage1', status: 'nominal', temperature: 18.5 },
      { id: 'power', status: 'nominal', temperature: 22.0 },
      { id: 'medical', status: 'nominal', temperature: 20.8 },
      { id: 'docking', status: 'nominal', temperature: 17.5 },
      { id: 'observatory', status: 'nominal', temperature: 19.0 },
    ],
    facilities: {
      reactor: { coreTemp: 345, outputKW: 200, rodStatus: 'withdrawn', coolantFlow: 94, status: 'nominal' },
      iceDrill: { depth: 2450, drillRate: 0.48, bitTemp: -12, status: 'nominal', breakthroughReached: false },
      oceanProbe: { deployed: false, descentDepth: 0, signalStrength: 100, discoveryLog: [], status: 'nominal' },
      tidalMonitor: { tidalStress: 3.2, quakeRisk: 0.02, lastQuakeMagnitude: 0 },
      radiationShield: { fluxLevel: 0.5, orbitalPhase: 0.25, shieldIntegrity: 92, shelterActive: false },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'EUROPA DEEP — Simulation initialized — all systems nominal', 89, 21600),
    ],
  } as EuropaSimulationState;
  initial.crewRoster = generateCrew('europa', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

// --- Europa tick ---

export function europaTick(state: EuropaSimulationState): { state: EuropaSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  // --- Advance mission time ---
  s.missionTime += 60;
  if (s.missionTime >= 86400) {
    s.missionTime -= 86400;
    s.missionDay += 1;
  }

  // --- Jupiter radiation cycle (~85hr orbital period, tick = 60s) ---
  s.facilities.radiationShield.orbitalPhase = (s.facilities.radiationShield.orbitalPhase + 60 / (85 * 3600)) % 1;
  const phase = s.facilities.radiationShield.orbitalPhase;
  // Flux peaks when facing Jupiter's magnetosphere (phase ~0.5)
  const baseFlux = 0.5 + 3.5 * Math.pow(Math.sin(phase * Math.PI), 4);
  s.facilities.radiationShield.fluxLevel = drift(baseFlux, baseFlux, 0.1, 0.2, 0.1, 8);
  s.radiation.external = s.facilities.radiationShield.fluxLevel;

  // Shield degradation during high flux
  if (s.facilities.radiationShield.fluxLevel > 2) {
    s.facilities.radiationShield.shieldIntegrity -= 0.05;
    if (!s.facilities.radiationShield.shelterActive && s.facilities.radiationShield.fluxLevel > 3) {
      s.facilities.radiationShield.shelterActive = true;
      newAlerts.push(createAlert('warning', 'RAD', `High radiation flux: ${s.facilities.radiationShield.fluxLevel.toFixed(1)} Sv/hr — crew shelter`, s.missionDay, s.missionTime));
    }
  } else {
    if (s.facilities.radiationShield.shelterActive) {
      s.facilities.radiationShield.shelterActive = false;
      newAlerts.push(createAlert('nominal', 'RAD', 'Radiation flux subsiding — shelter order lifted', s.missionDay, s.missionTime));
    }
  }

  // Shield repair (slow)
  s.facilities.radiationShield.shieldIntegrity = Math.min(100, s.facilities.radiationShield.shieldIntegrity + 0.01);

  // --- Atmosphere ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 21.0, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 490, 0.01, 5, 300, 1500);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 35, 0.02, 0.3, 20, 60);

  // --- Water ---
  s.water.reserves = drift(s.water.reserves, 45000, 0.005, 12, 25000, 60000);
  s.water.recyclingRate = drift(s.water.recyclingRate, 95, 0.03, 0.15, 80, 99);

  // --- Power (RTG only, no solar) ---
  s.power.solarGeneration = 0;
  s.power.consumption = drift(s.power.consumption, 75, 0.02, 0.8, 50, 110);
  const powerBalance = s.facilities.reactor.outputKW * 0.4 - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.003));

  // --- Comms ---
  if (s.comms.earthLink) {
    if (Math.random() < 0.001) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Jupiter occultation — Earth uplink lost', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 2700, 0.02, 30, 2400, 3600);
    s.comms.bandwidth = drift(s.comms.bandwidth, 1.2, 0.03, 0.05, 0.2, 3);
  } else {
    if (Math.random() < 0.01) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Earth uplink restored', s.missionDay, s.missionTime));
    }
  }

  // --- Ice Drill ---
  if (!s.facilities.iceDrill.breakthroughReached) {
    s.facilities.iceDrill.drillRate = drift(s.facilities.iceDrill.drillRate, 0.5, 0.03, 0.02, 0, 1.2);
    s.facilities.iceDrill.depth += s.facilities.iceDrill.drillRate * (60 / 3600);
    s.facilities.iceDrill.bitTemp = drift(s.facilities.iceDrill.bitTemp, -10, 0.02, 1, -50, 20);
    s.facilities.iceDrill.status = s.facilities.iceDrill.bitTemp > 10 ? 'warning' : 'nominal';

    // Breakthrough at ~15000m (very rare per tick)
    if (s.facilities.iceDrill.depth > 15000 && Math.random() < 0.001) {
      s.facilities.iceDrill.breakthroughReached = true;
      newAlerts.push(createAlert('critical', 'DRL', `ICE SHELL BREAKTHROUGH at ${s.facilities.iceDrill.depth.toFixed(0)}m — ocean contact!`, s.missionDay, s.missionTime));
    }
  }

  // --- Tidal Monitor ---
  s.facilities.tidalMonitor.tidalStress = drift(s.facilities.tidalMonitor.tidalStress, 3 + 4 * Math.sin(phase * Math.PI * 2), 0.05, 0.3, 0, 10);
  s.facilities.tidalMonitor.quakeRisk = Math.min(0.5, s.facilities.tidalMonitor.tidalStress / 20);

  if (Math.random() < s.facilities.tidalMonitor.quakeRisk * 0.01) {
    const mag = 1 + Math.random() * 4;
    s.facilities.tidalMonitor.lastQuakeMagnitude = mag;
    if (mag > 3) {
      newAlerts.push(createAlert('warning', 'TDL', `Tidal quake M${mag.toFixed(1)} — checking drill integrity`, s.missionDay, s.missionTime));
      s.facilities.iceDrill.drillRate *= 0.5; // Temporary slowdown
    } else {
      newAlerts.push(createAlert('nominal', 'TDL', `Minor tidal quake M${mag.toFixed(1)} registered`, s.missionDay, s.missionTime));
    }
  }

  // --- Ocean Probe ---
  if (s.facilities.iceDrill.breakthroughReached && !s.facilities.oceanProbe.deployed && Math.random() < 0.02) {
    s.facilities.oceanProbe.deployed = true;
    s.facilities.oceanProbe.descentDepth = 0;
    newAlerts.push(createAlert('nominal', 'PRB', 'Ocean probe deployed — beginning descent', s.missionDay, s.missionTime));
  }
  if (s.facilities.oceanProbe.deployed) {
    s.facilities.oceanProbe.descentDepth += drift(2, 2, 0.1, 0.5, 0, 10);
    s.facilities.oceanProbe.signalStrength = Math.max(5, 100 - s.facilities.oceanProbe.descentDepth * 0.01);
    s.facilities.oceanProbe.status = s.facilities.oceanProbe.signalStrength < 20 ? 'warning' : 'nominal';

    // Discovery events
    if (Math.random() < 0.003) {
      const discoveries = [
        'Thermal vent signature detected',
        'Organic compound traces in water sample',
        'Mineral crystalline structures observed',
        'Anomalous bioluminescence detected',
        'Complex carbon chains in sediment',
      ];
      const d = discoveries[Math.floor(Math.random() * discoveries.length)];
      s.facilities.oceanProbe.discoveryLog.push(d);
      newAlerts.push(createAlert('nominal', 'PRB', d, s.missionDay, s.missionTime));
    }
  }

  // --- Reactor ---
  s.facilities.reactor.coreTemp = drift(s.facilities.reactor.coreTemp, 345, 0.02, 1.5, 280, 420);
  s.facilities.reactor.outputKW = drift(s.facilities.reactor.outputKW, 200, 0.03, 1.5, 0, 250);
  s.facilities.reactor.coolantFlow = drift(s.facilities.reactor.coolantFlow, 94, 0.03, 0.5, 60, 100);
  s.facilities.reactor.status = s.facilities.reactor.coreTemp > 400 ? 'critical' : s.facilities.reactor.coreTemp > 380 ? 'warning' : 'nominal';

  // --- Module temperatures ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(m.temperature, m.id === 'airlock' ? 16.5 : m.id === 'docking' ? 17.5 : 20.0, 0.025, 0.1, 12, 28),
  }));

  // --- Random events ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'LAB', 'Sample analysis — saline ice crystals preserved', s.missionDay, s.missionTime),
      createAlert('nominal', 'OBS', 'Jupiter Great Red Spot transit observed', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Crew morale nominal — game night scheduled', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Radiation dosimetry review — within limits', s.missionDay, s.missionTime),
      createAlert('nominal', 'NUK', 'Reactor maintenance cycle complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'DRL', `Drill depth: ${s.facilities.iceDrill.depth.toFixed(0)}m — ice composition sampling`, s.missionDay, s.missionTime),
    ];
    newAlerts.push(events[Math.floor(Math.random() * events.length)]);
  }

  // --- Crew roster tick ---
  const crewResult = tickCrew(s.crewRoster);
  s.crewRoster = crewResult.roster;
  s.crew.evaActive = crewResult.evaActive;
  s.crew.medicalAlerts = crewResult.medicalAlerts;

  // --- Module statuses ---
  s.modules = s.modules.map(m => {
    let status: SystemStatus = 'nominal';
    if (m.id === 'lifesupport' && s.atmosphere.co2 > 1000) status = 'warning';
    if (m.id === 'power' && s.power.batteryLevel < 25) status = s.power.batteryLevel < 10 ? 'critical' : 'warning';
    if (m.id === 'comms' && !s.comms.earthLink) status = 'warning';
    if (m.id === 'rad-shield') {
      status = s.facilities.radiationShield.shieldIntegrity < 50 ? 'critical'
        : s.facilities.radiationShield.fluxLevel > 2 ? 'warning' : 'nominal';
    }
    return { ...m, status };
  });

  s.alerts = [...s.alerts, ...newAlerts].slice(-50);
  return { state: s, newAlerts };
}
