import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  type ReactorData,
  drift,
  gaussianRandom,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// --- Titan-specific interfaces ---

export interface TitanWeatherData {
  windSpeed: number;          // m/s, nominal ~1.5 (thick atmosphere)
  methaneRainActive: boolean;
  methaneRainIntensity: number; // 0-1
  surfaceTemp: number;        // celsius, ~-179
  atmosphericPressure: number; // kPa, ~147 (1.45 atm)
  visibility: number;         // km, 3-15
}

export interface MethaneHarvesterData {
  pumpRate: number;           // L/hr, nominal ~120
  tankLevel: number;          // %, 0-100
  pipelineStatus: 'flowing' | 'frozen' | 'idle';
  status: SystemStatus;
}

export interface CryoPowerData {
  stirlingOutput: number;     // kW, nominal ~45 (heat differential drives engines)
  heatDelta: number;          // K, temperature difference used
  efficiency: number;         // %, nominal ~60
  status: SystemStatus;
}

export interface AtmoProcessorData {
  n2FilterRate: number;       // kg/hr, nominal ~8
  ch4FilterRate: number;      // kg/hr, nominal ~3
  filterDegradation: number;  // %, 100=new, counts down
  toxicAlertActive: boolean;
  status: SystemStatus;
}

export interface TitanFacilitiesData {
  reactor: ReactorData;
  methaneHarvester: MethaneHarvesterData;
  cryoPower: CryoPowerData;
  atmoProcessor: AtmoProcessorData;
}

export interface TitanSimulationState extends Omit<SimulationState, 'facilities'> {
  weather: TitanWeatherData;
  facilities: TitanFacilitiesData;
}

// --- Internal rain tracking ---
let rainTicksRemaining = 0;

// --- Initial state ---

export function createTitanInitialState(): TitanSimulationState {
  const initial = {
    missionDay: 45,
    missionTime: 14400, // 04:00 (Titan day = ~16 Earth days)
    atmosphere: { pressure: 101.3, o2: 20.8, co2: 520, humidity: 38 },
    water: { reserves: 28000, recyclingRate: 94, dailyConsumption: 120 },
    power: { solarGeneration: 0, batteryLevel: 78, consumption: 65 }, // No solar on Titan
    comms: { earthLink: true, signalLatency: 4800, bandwidth: 0.8 }, // ~80 min latency
    crew: { total: 6, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.02, shieldStatus: true }, // Very low radiation on Titan
    weather: {
      windSpeed: 1.2,
      methaneRainActive: false,
      methaneRainIntensity: 0,
      surfaceTemp: -179,
      atmosphericPressure: 147,
      visibility: 8,
    },
    modules: [
      { id: 'command', status: 'nominal', temperature: 20.8 },
      { id: 'comms', status: 'nominal', temperature: 19.5 },
      { id: 'lifesupport', status: 'nominal', temperature: 20.5 },
      { id: 'storage', status: 'nominal', temperature: 16.8 },
      { id: 'power', status: 'nominal', temperature: 21.5 },
      { id: 'habitation', status: 'nominal', temperature: 21.0 },
      { id: 'research', status: 'nominal', temperature: 19.2 },
      { id: 'atmo-processor', status: 'nominal', temperature: 22.0 },
      { id: 'passage1', status: 'nominal', temperature: 18.5 },
      { id: 'medical', status: 'nominal', temperature: 20.5 },
      { id: 'airlock', status: 'nominal', temperature: 17.0 },
      { id: 'cryo-lab', status: 'nominal', temperature: 15.5 },
    ],
    facilities: {
      reactor: { coreTemp: 340, outputKW: 180, rodStatus: 'withdrawn', coolantFlow: 95, status: 'nominal' },
      methaneHarvester: { pumpRate: 118, tankLevel: 42, pipelineStatus: 'flowing', status: 'nominal' },
      cryoPower: { stirlingOutput: 44, heatDelta: 200, efficiency: 58, status: 'nominal' },
      atmoProcessor: { n2FilterRate: 7.8, ch4FilterRate: 2.9, filterDegradation: 85, toxicAlertActive: false, status: 'nominal' },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'HUYGENS OUTPOST — Simulation initialized — all systems nominal', 45, 14400),
    ],
  } as TitanSimulationState;
  initial.crewRoster = generateCrew('titan', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

// --- Titan tick ---

export function titanTick(state: TitanSimulationState): { state: TitanSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  // --- Advance mission time ---
  s.missionTime += 60;
  if (s.missionTime >= 86400) {
    s.missionTime -= 86400;
    s.missionDay += 1;
  }

  // --- Weather system ---
  s.weather.windSpeed = drift(s.weather.windSpeed, 1.5, 0.03, 0.1, 0.1, 6);
  s.weather.surfaceTemp = drift(s.weather.surfaceTemp, -179, 0.005, 0.3, -185, -170);
  s.weather.atmosphericPressure = drift(s.weather.atmosphericPressure, 147, 0.01, 0.2, 145, 150);

  if (!s.weather.methaneRainActive) {
    s.weather.visibility = drift(s.weather.visibility, 8, 0.03, 0.3, 3, 15);
    // 2% chance of methane rain per tick
    if (Math.random() < 0.02) {
      s.weather.methaneRainActive = true;
      s.weather.methaneRainIntensity = 0.1 + Math.random() * 0.4;
      rainTicksRemaining = 10 + Math.floor(Math.random() * 20); // 10-30 ticks
      newAlerts.push(createAlert('nominal', 'WTH', 'Methane precipitation detected — harvester output increasing', s.missionDay, s.missionTime));
    }
  } else {
    s.weather.methaneRainIntensity = drift(s.weather.methaneRainIntensity, 0.5, 0.05, 0.05, 0.05, 1.0);
    s.weather.visibility = drift(s.weather.visibility, 3, 0.05, 0.2, 1, 8);
    rainTicksRemaining--;
    if (rainTicksRemaining <= 0) {
      s.weather.methaneRainActive = false;
      s.weather.methaneRainIntensity = 0;
      newAlerts.push(createAlert('nominal', 'WTH', 'Methane rain subsiding — visibility improving', s.missionDay, s.missionTime));
    }
  }

  // --- Atmosphere drift ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 20.8, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 520, 0.01, 6, 300, 1800);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 38, 0.02, 0.3, 20, 65);

  // --- Water drift ---
  s.water.reserves = drift(s.water.reserves, 28000, 0.005, 10, 15000, 40000);
  s.water.recyclingRate = drift(s.water.recyclingRate, 94, 0.03, 0.15, 78, 99);
  s.water.dailyConsumption = drift(s.water.dailyConsumption, 120, 0.02, 1.5, 80, 180);

  // --- Power (no solar on Titan — RTG + Stirling only) ---
  s.power.solarGeneration = 0;
  s.power.consumption = drift(s.power.consumption, 65, 0.02, 0.8, 40, 95);
  const totalGeneration = s.facilities.reactor.outputKW * 0.5 + s.facilities.cryoPower.stirlingOutput;
  const powerBalance = totalGeneration - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.003));

  // --- Comms (very long latency to Earth via Saturn relay) ---
  if (s.comms.earthLink) {
    if (Math.random() < 0.002) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Saturn relay occultation — Earth uplink lost', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 4800, 0.02, 60, 4200, 5400);
    s.comms.bandwidth = drift(s.comms.bandwidth, 0.8, 0.03, 0.05, 0.1, 2);
  } else {
    if (Math.random() < 0.008) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Saturn relay signal restored', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = 0;
    s.comms.bandwidth = 0;
  }

  // --- Radiation (very low on Titan due to thick atmosphere + Saturn magnetosphere) ---
  s.radiation.external = drift(s.radiation.external, 0.02, 0.02, 0.005, 0.005, 0.15);

  // --- Crew roster tick ---
  const crewResult = tickCrew(s.crewRoster);
  s.crewRoster = crewResult.roster;
  s.crew.evaActive = crewResult.evaActive;
  s.crew.medicalAlerts = crewResult.medicalAlerts;

  // Force EVA recall during heavy rain
  if (s.weather.methaneRainActive && s.weather.methaneRainIntensity >= 0.3 && s.crew.evaActive > 0) {
    newAlerts.push(createAlert('warning', 'EVA', 'Heavy methane rain — emergency EVA recall', s.missionDay, s.missionTime));
    s.crew.evaActive = 0;
    s.crewRoster = s.crewRoster.map(m => m.status === 'eva' ? { ...m, status: 'active' } : m);
  }

  // --- Methane Harvester ---
  const rainBoost = s.weather.methaneRainActive ? s.weather.methaneRainIntensity * 60 : 0;
  s.facilities.methaneHarvester.pumpRate = drift(s.facilities.methaneHarvester.pumpRate, 120 + rainBoost, 0.05, 3, 0, 250);
  s.facilities.methaneHarvester.tankLevel = Math.min(100, s.facilities.methaneHarvester.tankLevel + s.facilities.methaneHarvester.pumpRate * 0.0002);
  // Slowly consume from tank
  s.facilities.methaneHarvester.tankLevel = Math.max(0, s.facilities.methaneHarvester.tankLevel - 0.02);

  if (s.weather.surfaceTemp < -183) {
    s.facilities.methaneHarvester.pipelineStatus = 'frozen';
    s.facilities.methaneHarvester.status = 'warning';
    if (Math.random() < 0.1) {
      newAlerts.push(createAlert('warning', 'MTH', 'Pipeline frozen — extreme cold detected', s.missionDay, s.missionTime));
    }
  } else {
    s.facilities.methaneHarvester.pipelineStatus = 'flowing';
    s.facilities.methaneHarvester.status = 'nominal';
  }

  // --- Cryo Power (Stirling engines) ---
  s.facilities.cryoPower.heatDelta = drift(s.facilities.cryoPower.heatDelta, 200, 0.02, 2, 150, 250);
  s.facilities.cryoPower.efficiency = drift(s.facilities.cryoPower.efficiency, 60, 0.03, 1, 35, 75);
  s.facilities.cryoPower.stirlingOutput = s.facilities.cryoPower.heatDelta * s.facilities.cryoPower.efficiency * 0.004;
  s.facilities.cryoPower.status = s.facilities.cryoPower.efficiency < 40 ? 'warning' : 'nominal';

  // --- Atmospheric Processor ---
  s.facilities.atmoProcessor.n2FilterRate = drift(s.facilities.atmoProcessor.n2FilterRate, 8, 0.03, 0.3, 0, 14);
  s.facilities.atmoProcessor.ch4FilterRate = drift(s.facilities.atmoProcessor.ch4FilterRate, 3, 0.03, 0.1, 0, 6);
  s.facilities.atmoProcessor.filterDegradation -= 0.015;

  if (s.facilities.atmoProcessor.filterDegradation < 15) {
    s.facilities.atmoProcessor.status = 'critical';
    s.facilities.atmoProcessor.toxicAlertActive = true;
    newAlerts.push(createAlert('critical', 'ATP', `Atmo filter critically degraded: ${s.facilities.atmoProcessor.filterDegradation.toFixed(0)}%`, s.missionDay, s.missionTime));
  } else if (s.facilities.atmoProcessor.filterDegradation < 30) {
    s.facilities.atmoProcessor.status = 'warning';
    s.facilities.atmoProcessor.toxicAlertActive = false;
  } else {
    s.facilities.atmoProcessor.status = 'nominal';
    s.facilities.atmoProcessor.toxicAlertActive = false;
  }

  // 2% chance of filter replacement
  if (Math.random() < 0.02) {
    s.facilities.atmoProcessor.filterDegradation = 100;
    s.facilities.atmoProcessor.status = 'nominal';
    s.facilities.atmoProcessor.toxicAlertActive = false;
  }

  // --- Reactor drift ---
  s.facilities.reactor.coreTemp = drift(s.facilities.reactor.coreTemp, 340, 0.02, 1.5, 280, 420);
  s.facilities.reactor.outputKW = drift(s.facilities.reactor.outputKW, 180, 0.03, 1.5, 0, 220);
  s.facilities.reactor.coolantFlow = drift(s.facilities.reactor.coolantFlow, 95, 0.03, 0.5, 60, 100);
  s.facilities.reactor.status = s.facilities.reactor.coreTemp > 400 ? 'critical' : s.facilities.reactor.coreTemp > 380 ? 'warning' : 'nominal';

  // --- Module temperatures (cold drift in extreme conditions) ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(
      m.temperature,
      m.id === 'airlock' ? 17.0 : m.id === 'cryo-lab' ? 15.5 : m.id === 'storage' ? 16.8 : 20.5,
      0.025,
      0.1,
      10,
      28
    ),
  }));

  // --- Threshold alerts ---
  if (s.atmosphere.co2 > 1000) {
    newAlerts.push(createAlert('warning', 'ATM', `CO₂ elevated: ${s.atmosphere.co2.toFixed(0)} ppm`, s.missionDay, s.missionTime));
  }
  if (s.power.batteryLevel < 25) {
    newAlerts.push(createAlert('warning', 'PWR', `Battery reserves low: ${s.power.batteryLevel.toFixed(1)}%`, s.missionDay, s.missionTime));
  }

  // --- Random Titan events ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'LAB', 'Cryogenic sample analysis — complex tholins detected', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Crew rotation — sleep cycle initiated', s.missionDay, s.missionTime),
      createAlert('nominal', 'MTH', 'Methane lake levels nominal — Kraken Mare stable', s.missionDay, s.missionTime),
      createAlert('nominal', 'CRY', 'Cryo-lab sample from ethane shoreline preserved', s.missionDay, s.missionTime),
      createAlert('nominal', 'NUK', 'Reactor coolant loop maintenance complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'ATP', 'Atmospheric composition scan — N₂ 94.2%, CH₄ 5.65%', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Crew health review — all nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'ALK', 'EVA suit thermal check — heaters nominal', s.missionDay, s.missionTime),
    ];
    newAlerts.push(events[Math.floor(Math.random() * events.length)]);
  }

  // --- Update module statuses ---
  s.modules = s.modules.map(m => {
    let status: SystemStatus = 'nominal';
    if (m.id === 'lifesupport' && (s.atmosphere.co2 > 1000 || s.atmosphere.pressure < 99.5)) {
      status = s.atmosphere.co2 > 1500 ? 'critical' : 'warning';
    }
    if (m.id === 'power' && s.power.batteryLevel < 25) {
      status = s.power.batteryLevel < 10 ? 'critical' : 'warning';
    }
    if (m.id === 'comms' && !s.comms.earthLink) {
      status = 'warning';
    }
    if (m.id === 'airlock' && s.crew.evaActive > 0) {
      status = 'warning';
    }
    if (m.id === 'atmo-processor') {
      status = s.facilities.atmoProcessor.status;
    }
    if (m.temperature < 12) {
      status = 'critical';
    } else if (m.temperature < 15) {
      status = status === 'nominal' ? 'warning' : status;
    }
    return { ...m, status };
  });

  // --- Keep only last 50 alerts ---
  s.alerts = [...s.alerts, ...newAlerts].slice(-50);

  return { state: s, newAlerts };
}
