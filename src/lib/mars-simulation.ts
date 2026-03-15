import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  type ReactorData,
  drift,
  gaussianRandom,
  createAlert,
  formatMissionTime,
  getSystemStatus,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// Re-export shared utilities for convenience
export { formatMissionTime, getSystemStatus };

// --- Mars-specific interfaces ---

export interface MarsWeatherData {
  windSpeed: number;        // m/s, nominal ~5, storms up to 30
  windDirection: number;    // degrees 0-360
  dustOpacity: number;      // tau, 0.3 nominal, 5+ during global storms
  surfaceTemp: number;      // celsius, -60 average
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dustStormActive: boolean;
  dustStormIntensity: number; // 0-1, 0=no storm, 1=global
}

export interface MoxieData {
  co2Intake: number;        // kg/hr, nominal ~12
  o2Output: number;         // kg/hr, nominal ~6
  efficiency: number;       // %, nominal ~85
  electrolysisTemp: number; // celsius, nominal ~800
  filterLife: number;       // %, counts down
  status: SystemStatus;
}

export interface SabatierData {
  ch4Production: number;    // kg/hr methane, nominal ~4
  loxProduction: number;    // kg/hr liquid oxygen, nominal ~8
  h2Consumption: number;    // kg/hr
  co2Consumption: number;   // kg/hr
  reactorTemp: number;      // celsius, nominal ~300
  status: SystemStatus;
}

export interface IceMiningData {
  drillDepth: number;       // meters, slowly increases
  iceExtracted: number;     // kg total accumulated
  meltRate: number;         // kg/hr, nominal ~50
  pumpStatus: 'running' | 'blocked' | 'idle';
  status: SystemStatus;
}

export interface WindPowerData {
  turbineCount: number;     // 5
  totalOutput: number;      // kW, nominal ~15 (Mars wind is weak)
  avgWindSpeed: number;     // m/s, mirrors weather
}

export interface LandingFieldData {
  landersPresent: number;   // 0-3
  fuelReserve: number;      // % of methane/LOX tanks
  fieldStatus: 'clear' | 'occupied' | 'launch-prep' | 'dust-restricted';
  status: SystemStatus;
}

export interface MarsFacilitiesData {
  reactor: ReactorData;
  iceMining: IceMiningData;
  landingField: LandingFieldData;
  moxie: MoxieData;
  sabatier: SabatierData;
  wind: WindPowerData;
}

export interface MarsSimulationState extends Omit<SimulationState, 'facilities'> {
  weather: MarsWeatherData;
  facilities: MarsFacilitiesData;
}

// --- Internal storm tracking ---
// We track storm duration via a module-level counter since the state interface
// doesn't carry it. This is reset when a new storm starts.
let stormTicksRemaining = 0;
let stormIsClearing = false;

// --- Initial state ---

export function createMarsInitialState(): MarsSimulationState {
  const initial = {
    missionDay: 142,
    missionTime: 28800, // 08:00 local
    atmosphere: { pressure: 101.3, o2: 20.9, co2: 580, humidity: 42 },
    water: { reserves: 62000, recyclingRate: 96, dailyConsumption: 240 },
    power: { solarGeneration: 68, batteryLevel: 82, consumption: 88 },
    comms: { earthLink: true, signalLatency: 720, bandwidth: 2.4 },
    crew: { total: 16, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.32, shieldStatus: true },
    weather: {
      windSpeed: 4.8,
      windDirection: 220,
      dustOpacity: 0.35,
      surfaceTemp: -58,
      season: 'summer',
      dustStormActive: false,
      dustStormIntensity: 0,
    },
    modules: [
      { id: 'command', status: 'nominal', temperature: 21.2 },
      { id: 'comms', status: 'nominal', temperature: 20.0 },
      { id: 'research', status: 'nominal', temperature: 20.4 },
      { id: 'lifesupport', status: 'nominal', temperature: 20.8 },
      { id: 'moxie', status: 'nominal', temperature: 22.5 },
      { id: 'greenhouse', status: 'nominal', temperature: 23.2 },
      { id: 'storage', status: 'nominal', temperature: 17.2 },
      { id: 'habitation', status: 'nominal', temperature: 21.5 },
      { id: 'medical', status: 'nominal', temperature: 21.0 },
      { id: 'bioprocessing', status: 'nominal', temperature: 22.0 },
      { id: 'waterprocessing', status: 'nominal', temperature: 20.2 },
      { id: 'greenhouse2', status: 'nominal', temperature: 23.0 },
      { id: 'greenhouse4', status: 'nominal', temperature: 23.1 },
      { id: 'passage1', status: 'nominal', temperature: 19.5 },
      { id: 'passage2', status: 'nominal', temperature: 19.5 },
      { id: 'observatory', status: 'nominal', temperature: 19.8 },
      { id: 'dome', status: 'nominal', temperature: 21.5 },
      { id: 'power', status: 'nominal', temperature: 22.1 },
      { id: 'airlock', status: 'nominal', temperature: 18.5 },
      { id: 'garagebay', status: 'nominal', temperature: 18.0 },
      { id: 'sabatier', status: 'nominal', temperature: 22.8 },
      { id: 'docking', status: 'nominal', temperature: 18.8 },
      { id: 'quarantine', status: 'nominal', temperature: 20.5 },
    ],
    facilities: {
      reactor: { coreTemp: 345, outputKW: 285, rodStatus: 'withdrawn', coolantFlow: 96, status: 'nominal' },
      iceMining: { drillDepth: 12.4, iceExtracted: 185000, meltRate: 48, pumpStatus: 'running', status: 'nominal' },
      landingField: { landersPresent: 2, fuelReserve: 74, fieldStatus: 'occupied', status: 'nominal' },
      moxie: { co2Intake: 11.8, o2Output: 5.9, efficiency: 84, electrolysisTemp: 795, filterLife: 72, status: 'nominal' },
      sabatier: { ch4Production: 3.8, loxProduction: 7.6, h2Consumption: 1.2, co2Consumption: 5.5, reactorTemp: 295, status: 'nominal' },
      wind: { turbineCount: 5, totalOutput: 14, avgWindSpeed: 4.8 },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'ARES STATION — Simulation initialized — all systems nominal', 142, 28800),
    ],
  } as MarsSimulationState;
  initial.crewRoster = generateCrew('mars', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

// --- Mars tick ---

const MARS_SOL_SECONDS = 88775;

export function marsTick(state: MarsSimulationState): { state: MarsSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  // --- Advance mission time (60 seconds per tick, Mars sol = 88775 seconds) ---
  s.missionTime += 60;
  if (s.missionTime >= MARS_SOL_SECONDS) {
    s.missionTime -= MARS_SOL_SECONDS;
    s.missionDay += 1;
  }

  // --- Weather system ---
  s.weather.windDirection = (s.weather.windDirection + gaussianRandom(0, 3) + 360) % 360;

  if (!s.weather.dustStormActive) {
    // Normal weather drift
    s.weather.windSpeed = drift(s.weather.windSpeed, 5, 0.03, 0.5, 0.5, 15);
    s.weather.dustOpacity = drift(s.weather.dustOpacity, 0.35, 0.02, 0.03, 0.1, 1.5);
    s.weather.surfaceTemp = drift(s.weather.surfaceTemp, -60, 0.01, 0.5, -120, -20);

    // Dust storm trigger: 0.3% chance per tick
    if (Math.random() < 0.003) {
      s.weather.dustStormActive = true;
      s.weather.dustStormIntensity = 0;
      stormIsClearing = false;

      // 0.05% chance of global dust storm (check within the 0.3%)
      if (Math.random() < 0.0167) { // ~0.05/0.3 conditional probability
        stormTicksRemaining = Math.floor(Math.random() * 41) + 40; // 40-80 ticks
        newAlerts.push(createAlert('critical', 'WTH', 'GLOBAL DUST STORM DEVELOPING — all surface operations suspended', s.missionDay, s.missionTime));
      } else {
        stormTicksRemaining = Math.floor(Math.random() * 21) + 10; // 10-30 ticks
        newAlerts.push(createAlert('warning', 'WTH', 'Dust storm detected — monitoring wind speeds', s.missionDay, s.missionTime));
      }
    }
  } else {
    // Storm active
    if (!stormIsClearing) {
      // Ramping up
      s.weather.dustStormIntensity = Math.min(1, s.weather.dustStormIntensity + (Math.random() * 0.05 + 0.05));
      stormTicksRemaining--;
      if (stormTicksRemaining <= 0) {
        stormIsClearing = true;
        newAlerts.push(createAlert('nominal', 'WTH', 'Dust storm beginning to subside', s.missionDay, s.missionTime));
      }
    } else {
      // Clearing
      s.weather.dustStormIntensity -= (Math.random() * 0.02 + 0.03);
      if (s.weather.dustStormIntensity < 0.05) {
        s.weather.dustStormActive = false;
        s.weather.dustStormIntensity = 0;
        stormIsClearing = false;
        newAlerts.push(createAlert('nominal', 'WTH', 'Dust storm cleared — surface operations may resume', s.missionDay, s.missionTime));
      }
    }

    // Storm effects on wind and dust opacity
    s.weather.windSpeed = drift(s.weather.windSpeed, 5 + s.weather.dustStormIntensity * 25, 0.1, 1, 0.5, 35);
    s.weather.dustOpacity = drift(s.weather.dustOpacity, 0.35 + s.weather.dustStormIntensity * 4, 0.1, 0.1, 0.1, 6);
    s.weather.surfaceTemp = drift(s.weather.surfaceTemp, -60, 0.01, 0.5, -120, -20);
  }

  // --- Crew roster tick ---
  const crewResult = tickCrew(s.crewRoster);
  s.crewRoster = crewResult.roster;
  s.crew.evaActive = crewResult.evaActive;
  s.crew.medicalAlerts = crewResult.medicalAlerts;

  // --- EVA cancellation during storms ---
  if (s.weather.dustStormActive && s.crew.evaActive > 0) {
    newAlerts.push(createAlert('critical', 'EVA', `Dust storm — emergency EVA recall for ${s.crew.evaActive} crew member(s)`, s.missionDay, s.missionTime));
    s.crew.evaActive = 0;
    // Force EVA crew back to active
    s.crewRoster = s.crewRoster.map(m => m.status === 'eva' ? { ...m, status: 'active' } : m);
  }

  // --- Atmosphere drift ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 20.9, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 580, 0.01, 8, 300, 2000);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 42, 0.02, 0.3, 25, 75);

  // --- Water drift ---
  s.water.reserves = drift(s.water.reserves, 62000, 0.005, 15, 40000, 75000);
  s.water.recyclingRate = drift(s.water.recyclingRate, 96, 0.03, 0.15, 80, 99);
  s.water.dailyConsumption = drift(s.water.dailyConsumption, 240, 0.02, 2, 180, 320);

  // --- Solar power (affected by dust) ---
  const solarBaseline = 70;
  const dustMultiplier = 1 / (1 + s.weather.dustOpacity * 2);
  s.power.solarGeneration = drift(s.power.solarGeneration, solarBaseline * dustMultiplier, 0.05, 1.5, 0, 100);

  // --- Wind power ---
  s.facilities.wind.avgWindSpeed = s.weather.windSpeed;
  s.facilities.wind.totalOutput = Math.min(30, s.facilities.wind.turbineCount * s.weather.windSpeed * 0.6);

  // --- Power balance (includes wind) ---
  s.power.consumption = drift(s.power.consumption, 88, 0.02, 1, 60, 130);
  const powerBalance = s.power.solarGeneration + s.facilities.wind.totalOutput - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.005));

  // --- Comms (Mars-specific: long latency, conjunction blackouts) ---
  if (s.comms.earthLink) {
    // 0.1% chance of conjunction blackout
    if (Math.random() < 0.001) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Solar conjunction — Earth uplink lost', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 720, 0.02, 20, 240, 1440);
    s.comms.bandwidth = drift(s.comms.bandwidth, 2.4, 0.03, 0.1, 0.5, 5);
  } else {
    // 0.5% chance of restoration (rare — takes time)
    if (Math.random() < 0.005) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Earth uplink restored — conjunction window passed', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = 0;
    s.comms.bandwidth = 0;
  }

  // --- Radiation ---
  s.radiation.external = drift(s.radiation.external, 0.32, 0.02, 0.01, 0.1, 3);
  if (s.radiation.external > 1.5 && s.radiation.shieldStatus) {
    newAlerts.push(createAlert('warning', 'RAD', `Elevated radiation: ${s.radiation.external.toFixed(2)} mSv/hr`, s.missionDay, s.missionTime));
  }

  // --- MOXIE ---
  s.facilities.moxie.co2Intake = drift(s.facilities.moxie.co2Intake, 12, 0.03, 0.3, 0, 18);
  s.facilities.moxie.o2Output = drift(s.facilities.moxie.o2Output, 6, 0.03, 0.15, 0, 10);
  s.facilities.moxie.electrolysisTemp = drift(s.facilities.moxie.electrolysisTemp, 800, 0.02, 3, 700, 900);
  s.facilities.moxie.filterLife -= 0.02;

  // Filter degradation effects
  if (s.facilities.moxie.filterLife < 20) {
    s.facilities.moxie.efficiency = drift(s.facilities.moxie.efficiency, 60, 0.05, 1, 30, 90);
    if (s.facilities.moxie.filterLife < 5) {
      s.facilities.moxie.status = 'critical';
      newAlerts.push(createAlert('critical', 'MOX', `MOXIE filter critically low: ${s.facilities.moxie.filterLife.toFixed(1)}%`, s.missionDay, s.missionTime));
    } else {
      s.facilities.moxie.status = 'warning';
      newAlerts.push(createAlert('warning', 'MOX', `MOXIE filter degraded: ${s.facilities.moxie.filterLife.toFixed(1)}% — efficiency reduced`, s.missionDay, s.missionTime));
    }
  } else {
    s.facilities.moxie.efficiency = drift(s.facilities.moxie.efficiency, 85, 0.03, 0.5, 60, 98);
    s.facilities.moxie.status = 'nominal';
  }

  // 2% chance of filter replacement
  if (Math.random() < 0.02) {
    s.facilities.moxie.filterLife = 100;
    s.facilities.moxie.status = 'nominal';
  }

  // --- Sabatier ---
  s.facilities.sabatier.ch4Production = drift(s.facilities.sabatier.ch4Production, 4, 0.03, 0.2, 0, 8);
  s.facilities.sabatier.loxProduction = drift(s.facilities.sabatier.loxProduction, 8, 0.03, 0.3, 0, 14);
  s.facilities.sabatier.h2Consumption = drift(s.facilities.sabatier.h2Consumption, 1.2, 0.03, 0.05, 0, 3);
  s.facilities.sabatier.co2Consumption = drift(s.facilities.sabatier.co2Consumption, 5.5, 0.03, 0.2, 0, 10);
  s.facilities.sabatier.reactorTemp = drift(s.facilities.sabatier.reactorTemp, 300, 0.02, 2, 250, 400);

  if (s.facilities.sabatier.reactorTemp > 380) {
    s.facilities.sabatier.status = 'critical';
    newAlerts.push(createAlert('critical', 'SAB', `Sabatier reactor temp critical: ${s.facilities.sabatier.reactorTemp.toFixed(0)}°C`, s.missionDay, s.missionTime));
  } else if (s.facilities.sabatier.reactorTemp > 350) {
    s.facilities.sabatier.status = 'warning';
    newAlerts.push(createAlert('warning', 'SAB', `Sabatier reactor temp elevated: ${s.facilities.sabatier.reactorTemp.toFixed(0)}°C`, s.missionDay, s.missionTime));
  } else {
    s.facilities.sabatier.status = 'nominal';
  }

  // --- Ice Mining ---
  s.facilities.iceMining.drillDepth += 0.001;
  s.facilities.iceMining.meltRate = drift(s.facilities.iceMining.meltRate, 50, 0.02, 1, 0, 80);

  if (s.facilities.iceMining.pumpStatus === 'running') {
    s.facilities.iceMining.iceExtracted += s.facilities.iceMining.meltRate * (60 / 3600); // kg per tick
    s.facilities.iceMining.status = 'nominal';
    // 0.2% chance of pump blockage
    if (Math.random() < 0.002) {
      s.facilities.iceMining.pumpStatus = 'blocked';
      s.facilities.iceMining.status = 'warning';
      newAlerts.push(createAlert('warning', 'ICE', 'Ice mining pump blockage detected — melt rate reduced', s.missionDay, s.missionTime));
    }
  } else if (s.facilities.iceMining.pumpStatus === 'blocked') {
    s.facilities.iceMining.status = 'warning';
    // 10% chance of unblocking each tick
    if (Math.random() < 0.10) {
      s.facilities.iceMining.pumpStatus = 'running';
      s.facilities.iceMining.status = 'nominal';
      newAlerts.push(createAlert('nominal', 'ICE', 'Ice mining pump cleared — operations resumed', s.missionDay, s.missionTime));
    }
  }

  // --- Landing field ---
  s.facilities.landingField.fuelReserve = Math.min(100, s.facilities.landingField.fuelReserve + 0.1);

  if (s.weather.dustStormActive) {
    s.facilities.landingField.fieldStatus = 'dust-restricted';
    s.facilities.landingField.status = 'warning';
  } else {
    if (s.facilities.landingField.fieldStatus === 'dust-restricted') {
      s.facilities.landingField.fieldStatus = s.facilities.landingField.landersPresent > 0 ? 'occupied' : 'clear';
      s.facilities.landingField.status = 'nominal';
    }
  }

  // --- Reactor drift ---
  s.facilities.reactor.coreTemp = drift(s.facilities.reactor.coreTemp, 350, 0.02, 1.5, 280, 420);
  s.facilities.reactor.outputKW = drift(s.facilities.reactor.outputKW, 285, 0.03, 2, 0, 320);
  s.facilities.reactor.coolantFlow = drift(s.facilities.reactor.coolantFlow, 96, 0.03, 0.5, 60, 100);
  s.facilities.reactor.status = s.facilities.reactor.coreTemp > 400 ? 'critical' : s.facilities.reactor.coreTemp > 380 ? 'warning' : 'nominal';

  // --- Module temperatures ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(
      m.temperature,
      m.id.startsWith('greenhouse') ? 23.2
        : m.id === 'airlock' || m.id === 'garagebay' ? 18.5
        : m.id === 'storage' ? 17.2
        : m.id === 'docking' ? 18.8
        : m.id === 'observatory' ? 19.8
        : m.id === 'passage1' || m.id === 'passage2' ? 19.5
        : m.id === 'moxie' || m.id === 'sabatier' ? 22.5
        : 21.0,
      0.02,
      0.08,
      15,
      30
    ),
  }));

  // --- Threshold-based alerts ---
  if (s.atmosphere.co2 > 1000) {
    newAlerts.push(createAlert('warning', 'ATM', `CO2 elevated: ${s.atmosphere.co2.toFixed(0)} ppm`, s.missionDay, s.missionTime));
  }
  if (s.atmosphere.co2 > 1500) {
    newAlerts.push(createAlert('critical', 'ATM', `CO2 critical: ${s.atmosphere.co2.toFixed(0)} ppm — scrubbers at max`, s.missionDay, s.missionTime));
  }
  if (s.atmosphere.pressure < 99.5) {
    newAlerts.push(createAlert('warning', 'ATM', `Pressure low: ${s.atmosphere.pressure.toFixed(1)} kPa`, s.missionDay, s.missionTime));
  }
  if (s.power.batteryLevel < 30) {
    newAlerts.push(createAlert('warning', 'PWR', `Battery reserves low: ${s.power.batteryLevel.toFixed(1)}%`, s.missionDay, s.missionTime));
  }
  if (s.power.batteryLevel < 15) {
    newAlerts.push(createAlert('critical', 'PWR', `Battery critical: ${s.power.batteryLevel.toFixed(1)}% — load shedding initiated`, s.missionDay, s.missionTime));
  }

  // --- Mars-specific random events (0.5% per tick) ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'WTH', 'Dust devil observed 2km east — no structural risk', s.missionDay, s.missionTime),
      createAlert('nominal', 'WTH', 'Atmospheric pressure fluctuation detected', s.missionDay, s.missionTime),
      createAlert('nominal', 'LAB', 'Areology sample analysis — possible fossil microbial structures', s.missionDay, s.missionTime),
      createAlert('nominal', 'GRN', 'Hydroponic harvest cycle completed — potato yield nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Water recycler filter replaced', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Crew health checks — all clear', s.missionDay, s.missionTime),
      createAlert('nominal', 'ALK', 'Suit pressure test complete — all nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'GAR', 'Rover maintenance complete — range 120km certified', s.missionDay, s.missionTime),
      createAlert('nominal', 'QRN', 'Quarantine sample review — no biological markers detected', s.missionDay, s.missionTime),
      createAlert('nominal', 'MOX', 'MOXIE output calibration complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'SAB', 'Sabatier catalyst check — performance nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'ICE', 'Subsurface ice vein mapping updated', s.missionDay, s.missionTime),
      createAlert('nominal', 'NUK', 'Reactor coolant loop maintenance scheduled', s.missionDay, s.missionTime),
      createAlert('nominal', 'LND', 'Landing beacon calibration verified', s.missionDay, s.missionTime),
      createAlert('nominal', 'FAB', '3D print job complete — drill bit replacement', s.missionDay, s.missionTime),
      createAlert('nominal', 'GR4', 'Greenhouse Delta — tomato seedlings transplanted', s.missionDay, s.missionTime),
    ];
    newAlerts.push(events[Math.floor(Math.random() * events.length)]);
  }

  // --- Update module statuses based on related systems ---
  s.modules = s.modules.map(m => {
    let status: SystemStatus = 'nominal';
    if (m.id === 'lifesupport' && (s.atmosphere.co2 > 1000 || s.atmosphere.pressure < 99.5)) {
      status = s.atmosphere.co2 > 1500 ? 'critical' : 'warning';
    }
    if (m.id === 'power' && s.power.batteryLevel < 30) {
      status = s.power.batteryLevel < 15 ? 'critical' : 'warning';
    }
    if (m.id === 'comms' && !s.comms.earthLink) {
      status = 'warning';
    }
    if (m.id === 'airlock' && s.crew.evaActive > 0) {
      status = 'warning';
    }
    if (m.id === 'moxie') {
      status = s.facilities.moxie.status;
    }
    return { ...m, status };
  });

  // --- Keep only last 50 alerts ---
  s.alerts = [...s.alerts, ...newAlerts].slice(-50);

  return { state: s, newAlerts };
}
