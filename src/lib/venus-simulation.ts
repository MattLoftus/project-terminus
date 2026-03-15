import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  drift,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// --- Venus-specific interfaces ---

export interface VenusAltitudeData {
  altitude: number;          // km, nominal 50, dangerous <45 or >55
  verticalRate: number;      // m/s, small fluctuations
  buoyancyGas: number;       // %, helium fill level
  envelopeIntegrity: number; // %, degrades from acid
  status: SystemStatus;
}

export interface VenusWindData {
  windSpeed: number;         // m/s, very strong at altitude ~60-80
  gustActive: boolean;
  windPowerOutput: number;   // kW, excellent wind resource
  turbineHealth: number;     // %, degrades from gusts
}

export interface AcidCorrosionData {
  corrosionRate: number;     // relative 0-10
  lastEventModule: string;
  maintenanceQueue: number;
}

export interface VenusFacilitiesData {
  altitude: VenusAltitudeData;
  wind: VenusWindData;
  acidCorrosion: AcidCorrosionData;
}

export interface VenusSimulationState extends Omit<SimulationState, 'facilities'> {
  facilities: VenusFacilitiesData;
}

export function createVenusInitialState(): VenusSimulationState {
  const initial = {
    missionDay: 112,
    missionTime: 28800, // 08:00
    atmosphere: { pressure: 101.3, o2: 21.0, co2: 450, humidity: 45 },
    water: { reserves: 35000, recyclingRate: 95, dailyConsumption: 160 },
    power: { solarGeneration: 90, batteryLevel: 88, consumption: 70 }, // Good solar + wind
    comms: { earthLink: true, signalLatency: 720, bandwidth: 3.0 }, // 6-14 min
    crew: { total: 8, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.08, shieldStatus: true }, // Low on Venus
    modules: [
      { id: 'command', status: 'nominal', temperature: 22.0 },
      { id: 'comms', status: 'nominal', temperature: 21.0 },
      { id: 'lifesupport', status: 'nominal', temperature: 21.5 },
      { id: 'storage', status: 'nominal', temperature: 19.0 },
      { id: 'power', status: 'nominal', temperature: 22.5 },
      { id: 'habitation', status: 'nominal', temperature: 22.0 },
      { id: 'research', status: 'nominal', temperature: 20.5 },
      { id: 'passage1', status: 'nominal', temperature: 20.0 },
      { id: 'medical', status: 'nominal', temperature: 21.0 },
      { id: 'airlock', status: 'nominal', temperature: 19.5 },
      { id: 'atmo-sampler', status: 'nominal', temperature: 20.0 },
      { id: 'observatory', status: 'nominal', temperature: 20.5 },
    ],
    facilities: {
      altitude: { altitude: 50.2, verticalRate: 0.1, buoyancyGas: 92, envelopeIntegrity: 95, status: 'nominal' },
      wind: { windSpeed: 65, gustActive: false, windPowerOutput: 55, turbineHealth: 88 },
      acidCorrosion: { corrosionRate: 1.5, lastEventModule: '', maintenanceQueue: 0 },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'APHRODITE AEROSTAT — Simulation initialized — all systems nominal', 112, 28800),
    ],
  } as VenusSimulationState;
  initial.crewRoster = generateCrew('venus', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

export function venusTick(state: VenusSimulationState): { state: VenusSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  s.missionTime += 60;
  if (s.missionTime >= 86400) { s.missionTime -= 86400; s.missionDay += 1; }

  // --- Altitude management ---
  s.facilities.altitude.verticalRate = drift(s.facilities.altitude.verticalRate, 0, 0.05, 0.05, -2, 2);
  s.facilities.altitude.altitude += s.facilities.altitude.verticalRate * 0.001;
  s.facilities.altitude.buoyancyGas = drift(s.facilities.altitude.buoyancyGas, 92, 0.01, 0.1, 70, 100);

  // Buoyancy correction (auto-stabilize around 50km)
  if (s.facilities.altitude.altitude < 48) {
    s.facilities.altitude.verticalRate += 0.3;
    s.facilities.altitude.status = 'warning';
    if (s.facilities.altitude.altitude < 46) {
      newAlerts.push(createAlert('critical', 'ALT', `Altitude critical: ${s.facilities.altitude.altitude.toFixed(1)}km — emergency ascent`, s.missionDay, s.missionTime));
      s.facilities.altitude.status = 'critical';
    }
  } else if (s.facilities.altitude.altitude > 53) {
    s.facilities.altitude.verticalRate -= 0.2;
    s.facilities.altitude.status = 'warning';
  } else {
    s.facilities.altitude.status = 'nominal';
  }

  // Envelope degradation from acid
  s.facilities.altitude.envelopeIntegrity -= 0.003;
  if (s.facilities.altitude.envelopeIntegrity < 80) {
    newAlerts.push(createAlert('warning', 'ALT', `Envelope integrity: ${s.facilities.altitude.envelopeIntegrity.toFixed(0)}% — acid damage`, s.missionDay, s.missionTime));
  }
  // Repair (slow)
  if (Math.random() < 0.005) {
    s.facilities.altitude.envelopeIntegrity = Math.min(100, s.facilities.altitude.envelopeIntegrity + 5);
  }

  // --- Wind power ---
  s.facilities.wind.windSpeed = drift(s.facilities.wind.windSpeed, 65, 0.03, 2, 30, 120);

  if (!s.facilities.wind.gustActive && Math.random() < 0.01) {
    s.facilities.wind.gustActive = true;
    s.facilities.wind.windSpeed += 20 + Math.random() * 20;
    newAlerts.push(createAlert('warning', 'WND', `Wind gust: ${s.facilities.wind.windSpeed.toFixed(0)} m/s`, s.missionDay, s.missionTime));
    s.facilities.wind.turbineHealth -= 2 + Math.random() * 3;
  } else if (s.facilities.wind.gustActive && Math.random() < 0.1) {
    s.facilities.wind.gustActive = false;
  }

  s.facilities.wind.windPowerOutput = Math.min(80, s.facilities.wind.windSpeed * 0.8 * (s.facilities.wind.turbineHealth / 100));
  s.facilities.wind.turbineHealth = drift(s.facilities.wind.turbineHealth, 90, 0.005, 0.1, 40, 100);
  if (Math.random() < 0.005) s.facilities.wind.turbineHealth = Math.min(100, s.facilities.wind.turbineHealth + 8); // repair

  // --- Acid corrosion events ---
  s.facilities.acidCorrosion.corrosionRate = drift(s.facilities.acidCorrosion.corrosionRate, 1.5, 0.03, 0.1, 0.5, 5);
  if (Math.random() < 0.003 * s.facilities.acidCorrosion.corrosionRate) {
    const targets = ['lifesupport', 'comms', 'storage', 'power', 'research', 'airlock'];
    const target = targets[Math.floor(Math.random() * targets.length)];
    s.facilities.acidCorrosion.lastEventModule = target;
    s.facilities.acidCorrosion.maintenanceQueue++;
    newAlerts.push(createAlert('warning', 'ACD', `Acid corrosion event on ${target} — maintenance required`, s.missionDay, s.missionTime));
  }
  // Process maintenance queue
  if (s.facilities.acidCorrosion.maintenanceQueue > 0 && Math.random() < 0.02) {
    s.facilities.acidCorrosion.maintenanceQueue--;
  }

  // --- Atmosphere ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 21.0, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 450, 0.01, 5, 300, 1200);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 45, 0.02, 0.3, 25, 70);

  // --- Water ---
  s.water.reserves = drift(s.water.reserves, 35000, 0.005, 10, 18000, 50000);

  // --- Power (solar + wind, both excellent on Venus) ---
  s.power.solarGeneration = drift(s.power.solarGeneration, 90, 0.03, 1.5, 30, 120);
  s.power.consumption = drift(s.power.consumption, 70, 0.02, 0.8, 40, 100);
  const totalGen = s.power.solarGeneration + s.facilities.wind.windPowerOutput;
  const powerBalance = totalGen - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.002));

  // --- Comms ---
  if (s.comms.earthLink) {
    if (Math.random() < 0.0005) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Superior conjunction — Earth link interrupted', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 720, 0.02, 30, 360, 840);
    s.comms.bandwidth = drift(s.comms.bandwidth, 3.0, 0.03, 0.1, 0.5, 6);
  } else {
    if (Math.random() < 0.01) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Earth link restored', s.missionDay, s.missionTime));
    }
  }

  // --- Module temperatures ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(m.temperature, m.id === 'airlock' ? 19.5 : 21.5, 0.02, 0.08, 16, 30),
  }));

  // --- Random events ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'LAB', 'Cloud sample — sulfuric acid concentration nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'OBS', 'UV fluorescence in upper cloud deck observed', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Crew sunrise viewing session — solar elevation 12°', s.missionDay, s.missionTime),
      createAlert('nominal', 'ATS', 'Atmospheric sample retrieved — phosphine trace detected', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Crew health review — all nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'ALT', `Station altitude: ${s.facilities.altitude.altitude.toFixed(1)}km — buoyancy nominal`, s.missionDay, s.missionTime),
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
    if (m.id === 'lifesupport' && s.atmosphere.co2 > 800) status = 'warning';
    if (m.id === 'power' && s.power.batteryLevel < 25) status = s.power.batteryLevel < 10 ? 'critical' : 'warning';
    if (m.id === 'comms' && !s.comms.earthLink) status = 'warning';
    if (m.id === 'command') status = s.facilities.altitude.status;
    return { ...m, status };
  });

  s.alerts = [...s.alerts, ...newAlerts].slice(-50);
  return { state: s, newAlerts };
}
