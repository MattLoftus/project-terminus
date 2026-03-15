import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  type ReactorData,
  drift,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// --- Ceres-specific interfaces ---

export interface MiningRigData {
  id: string;
  depth: number;          // meters
  rate: number;           // kg/hr
  maintenance: number;    // %, counts down
  status: SystemStatus;
}

export interface MassDriverData {
  chargeLevel: number;     // %, 0-100
  payloadReady: boolean;
  launchCount: number;
  status: SystemStatus;
}

export interface SpinModuleData {
  rpm: number;            // nominal ~4
  bearingWear: number;    // %, 100=new
  gravityLevel: number;   // g, nominal ~0.3
  status: SystemStatus;
}

export interface OreStockpileData {
  totalKg: number;
  processedKg: number;
  processingRate: number; // kg/hr
}

export interface CeresFacilitiesData {
  reactor: ReactorData;
  miningRigs: MiningRigData[];
  massDriver: MassDriverData;
  spinModule: SpinModuleData;
  oreStockpile: OreStockpileData;
}

export interface CeresSimulationState extends Omit<SimulationState, 'facilities'> {
  facilities: CeresFacilitiesData;
}

export function createCeresInitialState(): CeresSimulationState {
  const initial = {
    missionDay: 203,
    missionTime: 36000, // 10:00
    atmosphere: { pressure: 101.3, o2: 21.0, co2: 480, humidity: 32 },
    water: { reserves: 55000, recyclingRate: 96, dailyConsumption: 200 },
    power: { solarGeneration: 25, batteryLevel: 82, consumption: 80 },
    comms: { earthLink: true, signalLatency: 1500, bandwidth: 1.8 },
    crew: { total: 10, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.15, shieldStatus: true },
    modules: [
      { id: 'command', status: 'nominal', temperature: 20.5 },
      { id: 'comms', status: 'nominal', temperature: 19.5 },
      { id: 'lifesupport', status: 'nominal', temperature: 20.2 },
      { id: 'storage', status: 'nominal', temperature: 17.0 },
      { id: 'power', status: 'nominal', temperature: 21.5 },
      { id: 'habitation', status: 'nominal', temperature: 21.0 },
      { id: 'research', status: 'nominal', temperature: 19.8 },
      { id: 'passage1', status: 'nominal', temperature: 18.5 },
      { id: 'airlock', status: 'nominal', temperature: 16.5 },
      { id: 'spin-gravity', status: 'nominal', temperature: 20.8 },
      { id: 'medical', status: 'nominal', temperature: 20.5 },
      { id: 'docking', status: 'nominal', temperature: 17.5 },
      { id: 'observatory', status: 'nominal', temperature: 19.0 },
    ],
    facilities: {
      reactor: { coreTemp: 345, outputKW: 190, rodStatus: 'withdrawn', coolantFlow: 95, status: 'nominal' },
      miningRigs: [
        { id: 'rig-1', depth: 45, rate: 80, maintenance: 78, status: 'nominal' },
        { id: 'rig-2', depth: 32, rate: 72, maintenance: 85, status: 'nominal' },
        { id: 'rig-3', depth: 18, rate: 65, maintenance: 92, status: 'nominal' },
      ],
      massDriver: { chargeLevel: 45, payloadReady: false, launchCount: 12, status: 'nominal' },
      spinModule: { rpm: 4.0, bearingWear: 88, gravityLevel: 0.3, status: 'nominal' },
      oreStockpile: { totalKg: 85000, processedKg: 42000, processingRate: 120 },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'DAWN STATION — Simulation initialized — all systems nominal', 203, 36000),
    ],
  } as CeresSimulationState;
  initial.crewRoster = generateCrew('ceres', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

export function ceresTick(state: CeresSimulationState): { state: CeresSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  s.missionTime += 60;
  if (s.missionTime >= 86400) { s.missionTime -= 86400; s.missionDay += 1; }

  // --- Atmosphere ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 21.0, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 480, 0.01, 5, 300, 1500);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 32, 0.02, 0.3, 18, 55);

  // --- Water ---
  s.water.reserves = drift(s.water.reserves, 55000, 0.005, 12, 30000, 70000);
  s.water.recyclingRate = drift(s.water.recyclingRate, 96, 0.03, 0.15, 80, 99);

  // --- Power (limited solar at Ceres distance) ---
  s.power.solarGeneration = drift(s.power.solarGeneration, 25, 0.03, 0.5, 0, 40);
  s.power.consumption = drift(s.power.consumption, 80, 0.02, 0.8, 50, 120);
  const totalGen = s.power.solarGeneration + s.facilities.reactor.outputKW * 0.4;
  const powerBalance = totalGen - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.003));

  // --- Comms ---
  if (s.comms.earthLink) {
    if (Math.random() < 0.001) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Solar conjunction — Earth uplink interrupted', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 1500, 0.02, 30, 900, 2400);
    s.comms.bandwidth = drift(s.comms.bandwidth, 1.8, 0.03, 0.05, 0.3, 4);
  } else {
    if (Math.random() < 0.008) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Earth uplink restored', s.missionDay, s.missionTime));
    }
  }

  // --- Radiation ---
  s.radiation.external = drift(s.radiation.external, 0.15, 0.02, 0.01, 0.05, 0.8);

  // --- Mining Rigs ---
  for (const rig of s.facilities.miningRigs) {
    rig.rate = drift(rig.rate, 75, 0.03, 2, 0, 120);
    rig.depth += rig.rate * 0.00002;
    rig.maintenance -= 0.01;

    if (rig.maintenance < 15) {
      rig.status = 'critical';
      rig.rate *= 0.3;
      if (Math.random() < 0.05) {
        newAlerts.push(createAlert('critical', 'MNG', `${rig.id} maintenance critical: ${rig.maintenance.toFixed(0)}%`, s.missionDay, s.missionTime));
      }
    } else if (rig.maintenance < 30) {
      rig.status = 'warning';
    } else {
      rig.status = 'nominal';
    }

    // 1% chance of maintenance reset
    if (Math.random() < 0.01) {
      rig.maintenance = 100;
      rig.status = 'nominal';
    }

    // Accumulate ore
    s.facilities.oreStockpile.totalKg += rig.rate * (60 / 3600);
  }

  // --- Ore processing ---
  s.facilities.oreStockpile.processingRate = drift(s.facilities.oreStockpile.processingRate, 120, 0.03, 3, 0, 200);
  const processed = s.facilities.oreStockpile.processingRate * (60 / 3600);
  s.facilities.oreStockpile.processedKg += processed;

  // --- Mass Driver ---
  s.facilities.massDriver.chargeLevel = Math.min(100, s.facilities.massDriver.chargeLevel + 0.5);
  if (!s.facilities.massDriver.payloadReady && s.facilities.oreStockpile.processedKg > 50000) {
    s.facilities.massDriver.payloadReady = true;
    newAlerts.push(createAlert('nominal', 'MDR', 'Mass driver payload threshold reached — ready for launch', s.missionDay, s.missionTime));
  }

  if (s.facilities.massDriver.payloadReady && s.facilities.massDriver.chargeLevel >= 95 && Math.random() < 0.02) {
    s.facilities.massDriver.launchCount++;
    s.facilities.massDriver.chargeLevel = 0;
    s.facilities.massDriver.payloadReady = false;
    s.facilities.oreStockpile.processedKg -= 45000;
    newAlerts.push(createAlert('nominal', 'MDR', `Mass driver launch #${s.facilities.massDriver.launchCount} — payload en route`, s.missionDay, s.missionTime));
  }

  // 0.5% misfire chance during launch attempt
  if (s.facilities.massDriver.chargeLevel > 90 && Math.random() < 0.005) {
    s.facilities.massDriver.status = 'warning';
    s.facilities.massDriver.chargeLevel *= 0.5;
    newAlerts.push(createAlert('warning', 'MDR', 'Mass driver charge anomaly — partial discharge', s.missionDay, s.missionTime));
  } else {
    s.facilities.massDriver.status = 'nominal';
  }

  // --- Spin Module ---
  s.facilities.spinModule.rpm = drift(s.facilities.spinModule.rpm, 4.0, 0.02, 0.05, 0, 6);
  s.facilities.spinModule.bearingWear -= 0.005;
  s.facilities.spinModule.gravityLevel = s.facilities.spinModule.rpm * 0.075;

  if (s.facilities.spinModule.bearingWear < 20) {
    s.facilities.spinModule.status = 'warning';
    if (Math.random() < 0.02) {
      newAlerts.push(createAlert('warning', 'SPN', `Spin module bearing wear: ${s.facilities.spinModule.bearingWear.toFixed(0)}%`, s.missionDay, s.missionTime));
    }
  } else {
    s.facilities.spinModule.status = 'nominal';
  }
  if (Math.random() < 0.008) {
    s.facilities.spinModule.bearingWear = Math.min(100, s.facilities.spinModule.bearingWear + 30);
  }

  // --- Reactor ---
  s.facilities.reactor.coreTemp = drift(s.facilities.reactor.coreTemp, 345, 0.02, 1.5, 280, 420);
  s.facilities.reactor.outputKW = drift(s.facilities.reactor.outputKW, 190, 0.03, 1.5, 0, 240);
  s.facilities.reactor.coolantFlow = drift(s.facilities.reactor.coolantFlow, 95, 0.03, 0.5, 60, 100);
  s.facilities.reactor.status = s.facilities.reactor.coreTemp > 400 ? 'critical' : s.facilities.reactor.coreTemp > 380 ? 'warning' : 'nominal';

  // --- Module temperatures ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(m.temperature, m.id === 'airlock' ? 16.5 : m.id === 'docking' ? 17.5 : 20.5, 0.025, 0.1, 12, 28),
  }));

  // --- Random events ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'LAB', 'Ore sample analysis — high platinum group metal content', s.missionDay, s.missionTime),
      createAlert('nominal', 'OBS', 'Near-Ceres asteroid tracked — no collision risk', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Crew rotation to spin module — exercise period', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Low-g health assessment — bone density nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'NUK', 'Reactor coolant system maintenance complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'MNG', `Total ore extracted: ${(s.facilities.oreStockpile.totalKg / 1000).toFixed(1)} t`, s.missionDay, s.missionTime),
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
    if (m.id === 'spin-gravity') status = s.facilities.spinModule.status;
    return { ...m, status };
  });

  s.alerts = [...s.alerts, ...newAlerts].slice(-50);
  return { state: s, newAlerts };
}
