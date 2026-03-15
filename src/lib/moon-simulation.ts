import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  drift,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

export function createMoonInitialState(): SimulationState {
  const initial: SimulationState = {
    missionDay: 847,
    missionTime: 13920, // 03:52 UTC
    atmosphere: { pressure: 101.3, o2: 20.9, co2: 620, humidity: 48 },
    water: { reserves: 48500, recyclingRate: 94.2, dailyConsumption: 195 },
    power: { solarGeneration: 118, batteryLevel: 87, consumption: 94 },
    comms: { earthLink: true, signalLatency: 1.28, bandwidth: 10.4 },
    crew: { total: 12, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],  // populated below
    radiation: { external: 0.48, shieldStatus: true },
    modules: [
      { id: 'command', status: 'nominal', temperature: 21.2 },
      { id: 'lifesupport', status: 'nominal', temperature: 20.8 },
      { id: 'habitation', status: 'nominal', temperature: 21.5 },
      { id: 'research', status: 'nominal', temperature: 20.4 },
      { id: 'power', status: 'nominal', temperature: 22.1 },
      { id: 'comms', status: 'nominal', temperature: 20.0 },
      { id: 'medical', status: 'nominal', temperature: 21.0 },
      { id: 'greenhouse', status: 'nominal', temperature: 23.2 },
      { id: 'airlock', status: 'nominal', temperature: 18.5 },
      { id: 'observatory', status: 'nominal', temperature: 19.8 },
      { id: 'workshop', status: 'nominal', temperature: 21.8 },
      { id: 'recreation', status: 'nominal', temperature: 21.4 },
      { id: 'storage', status: 'nominal', temperature: 17.2 },
      { id: 'bioprocessing', status: 'nominal', temperature: 22.0 },
      { id: 'logistics', status: 'nominal', temperature: 20.5 },
      { id: 'fabrication', status: 'nominal', temperature: 22.5 },
      { id: 'greenhouse2', status: 'nominal', temperature: 23.0 },
      { id: 'greenhouse3', status: 'nominal', temperature: 23.4 },
      { id: 'passage1', status: 'nominal', temperature: 19.5 },
      { id: 'passage2', status: 'nominal', temperature: 19.5 },
      { id: 'storage2', status: 'nominal', temperature: 17.0 },
      { id: 'docking', status: 'nominal', temperature: 18.8 },
    ],
    facilities: {
      reactor: { coreTemp: 348, outputKW: 278, rodStatus: 'withdrawn', coolantFlow: 95.2, status: 'nominal' },
      isru: { throughput: 118, regolithProcessed: 284500, o2ProductionRate: 7.8, h2oProductionRate: 4.9, hopperStatus: 'running', status: 'nominal' },
      launchPads: [
        { id: 'pad-1', fuelLevel: 92, padStatus: 'occupied', status: 'nominal' },
        { id: 'pad-2', fuelLevel: 67, padStatus: 'fueling', status: 'nominal' },
        { id: 'pad-3', fuelLevel: 0, padStatus: 'empty', status: 'nominal' },
      ],
    },
    alerts: [
      createAlert('nominal', 'SYS', 'Simulation initialized — all systems nominal', 847, 13920),
    ],
  } as SimulationState;
  initial.crewRoster = generateCrew('moon', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

export function moonTick(state: SimulationState): { state: SimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  // Advance mission time (~2 seconds per tick, accelerated 30x)
  s.missionTime += 60;
  if (s.missionTime >= 86400) {
    s.missionTime -= 86400;
    s.missionDay += 1;
  }

  // Atmosphere drift
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 20.9, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 620, 0.01, 8, 300, 2000);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 48, 0.02, 0.3, 25, 75);

  // Water drift
  s.water.reserves = drift(s.water.reserves, 48500, 0.005, 15, 30000, 55000);
  s.water.recyclingRate = drift(s.water.recyclingRate, 94.2, 0.03, 0.15, 80, 99);
  s.water.dailyConsumption = drift(s.water.dailyConsumption, 195, 0.02, 2, 150, 280);

  // Power drift (solar varies with lunar day cycle)
  const solarCycle = Math.sin((s.missionTime / 86400) * Math.PI) * 0.3 + 0.85;
  s.power.solarGeneration = drift(s.power.solarGeneration, 120 * solarCycle, 0.03, 1.5, 0, 150);
  s.power.consumption = drift(s.power.consumption, 94, 0.02, 1, 60, 130);
  const powerBalance = s.power.solarGeneration - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.005));

  // Comms (occasional dropouts)
  if (s.comms.earthLink && Math.random() < 0.003) {
    s.comms.earthLink = false;
    newAlerts.push(createAlert('warning', 'COM', 'Earth uplink signal lost', s.missionDay, s.missionTime));
  } else if (!s.comms.earthLink && Math.random() < 0.15) {
    s.comms.earthLink = true;
    newAlerts.push(createAlert('nominal', 'COM', 'Earth uplink restored', s.missionDay, s.missionTime));
  }
  s.comms.signalLatency = s.comms.earthLink ? drift(s.comms.signalLatency, 1.28, 0.05, 0.02, 1.2, 1.5) : 0;
  s.comms.bandwidth = s.comms.earthLink ? drift(s.comms.bandwidth, 10.4, 0.03, 0.3, 5, 15) : 0;

  // Radiation spikes
  s.radiation.external = drift(s.radiation.external, 0.48, 0.02, 0.02, 0.1, 5);
  if (s.radiation.external > 2.0 && s.radiation.shieldStatus) {
    newAlerts.push(createAlert('warning', 'RAD', `Elevated radiation: ${s.radiation.external.toFixed(2)} mSv/hr`, s.missionDay, s.missionTime));
  }

  // Crew roster tick
  const crewResult = tickCrew(s.crewRoster);
  s.crewRoster = crewResult.roster;
  s.crew.evaActive = crewResult.evaActive;
  s.crew.medicalAlerts = crewResult.medicalAlerts;

  // Module temperatures
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(
      m.temperature,
      m.id === 'greenhouse' || m.id === 'greenhouse2' || m.id === 'greenhouse3' ? 23.2
        : m.id === 'airlock' ? 18.5
        : m.id === 'storage' || m.id === 'storage2' ? 17.2
        : m.id === 'docking' ? 18.8
        : m.id === 'observatory' ? 19.8
        : m.id === 'passage1' || m.id === 'passage2' ? 19.5
        : m.id === 'fabrication' ? 22.5
        : 21.0,
      0.02,
      0.08,
      15,
      30
    ),
  }));

  // Reactor drift
  s.facilities.reactor.coreTemp = drift(s.facilities.reactor.coreTemp, 350, 0.02, 1.5, 280, 420);
  s.facilities.reactor.outputKW = drift(s.facilities.reactor.outputKW, 280, 0.03, 2, 0, 320);
  s.facilities.reactor.coolantFlow = drift(s.facilities.reactor.coolantFlow, 95, 0.03, 0.5, 60, 100);
  s.facilities.reactor.status = s.facilities.reactor.coreTemp > 400 ? 'critical' : s.facilities.reactor.coreTemp > 380 ? 'warning' : 'nominal';

  // ISRU drift
  s.facilities.isru.throughput = drift(s.facilities.isru.throughput, 120, 0.02, 2, 0, 160);
  s.facilities.isru.regolithProcessed += s.facilities.isru.throughput * (60 / 3600);
  s.facilities.isru.o2ProductionRate = drift(s.facilities.isru.o2ProductionRate, 8, 0.02, 0.3, 0, 12);
  s.facilities.isru.h2oProductionRate = drift(s.facilities.isru.h2oProductionRate, 5, 0.02, 0.2, 0, 8);
  s.facilities.isru.status = s.facilities.isru.hopperStatus === 'jammed' ? 'warning' : 'nominal';

  // ISRU hopper jam events
  if (Math.random() < 0.003 && s.facilities.isru.hopperStatus === 'running') {
    s.facilities.isru.hopperStatus = 'jammed';
    newAlerts.push(createAlert('warning', 'ISRU', 'Regolith hopper jam detected — throughput reduced', s.missionDay, s.missionTime));
  }
  if (s.facilities.isru.hopperStatus === 'jammed' && Math.random() < 0.08) {
    s.facilities.isru.hopperStatus = 'running';
    newAlerts.push(createAlert('nominal', 'ISRU', 'Hopper jam cleared — throughput nominal', s.missionDay, s.missionTime));
  }

  // Launch pad fueling
  s.facilities.launchPads = s.facilities.launchPads.map(pad => {
    const p = { ...pad };
    if (p.padStatus === 'fueling') {
      p.fuelLevel = Math.min(100, p.fuelLevel + 0.3);
      if (p.fuelLevel >= 100) {
        p.padStatus = 'occupied';
        newAlerts.push(createAlert('nominal', 'PAD', `${p.id.toUpperCase()} fueling complete — vehicle ready`, s.missionDay, s.missionTime));
      }
    }
    p.status = p.padStatus === 'launch-prep' ? 'warning' : 'nominal';
    return p;
  });

  // Threshold-based alerts
  if (s.atmosphere.co2 > 1000) {
    newAlerts.push(createAlert('warning', 'ATM', `CO₂ elevated: ${s.atmosphere.co2.toFixed(0)} ppm`, s.missionDay, s.missionTime));
  }
  if (s.atmosphere.co2 > 1500) {
    newAlerts.push(createAlert('critical', 'ATM', `CO₂ critical: ${s.atmosphere.co2.toFixed(0)} ppm — scrubbers at max`, s.missionDay, s.missionTime));
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

  // Occasional random events
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'LAB', 'Regolith sample analysis complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'GRN', 'Hydroponic harvest cycle completed', s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Water recycler filter replaced', s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Crew health checks — all clear', s.missionDay, s.missionTime),
      createAlert('warning', 'ALK', 'Outer seal pressure variance detected', s.missionDay, s.missionTime),
      createAlert('nominal', 'OBS', 'Transient lunar phenomenon logged — Aristarchus region', s.missionDay, s.missionTime),
      createAlert('nominal', 'FAB', '3D print job complete — replacement valve housing', s.missionDay, s.missionTime),
      createAlert('nominal', 'STR', 'Cargo manifest audit — all items accounted for', s.missionDay, s.missionTime),
      createAlert('nominal', 'BIO', 'Composting cycle complete — nutrient output nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'MFG', 'Fabrication queue cleared — 3 parts produced', s.missionDay, s.missionTime),
      createAlert('nominal', 'LOG', 'Cargo transfer j5→j8 complete', s.missionDay, s.missionTime),
      createAlert('nominal', 'DCK', 'Supply lander docked — cargo manifest uploaded', s.missionDay, s.missionTime),
      createAlert('nominal', 'GR2', 'Grain harvest cycle completed — 12kg yield', s.missionDay, s.missionTime),
      createAlert('nominal', 'NUK', 'Reactor coolant loop maintenance scheduled', s.missionDay, s.missionTime),
      createAlert('nominal', 'ISRU', 'Regolith batch processed — 500kg yield', s.missionDay, s.missionTime),
      createAlert('nominal', 'PAD', 'PAD-2 propellant transfer nominal', s.missionDay, s.missionTime),
    ];
    newAlerts.push(events[Math.floor(Math.random() * events.length)]);
  }

  // Update module statuses based on related systems
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
      status = 'warning'; // active, not a problem, but noteworthy
    }
    return { ...m, status };
  });

  // Keep only last 50 alerts
  s.alerts = [...s.alerts, ...newAlerts].slice(-50);

  return { state: s, newAlerts };
}
