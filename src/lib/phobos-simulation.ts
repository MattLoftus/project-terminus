import type { SystemStatus } from '../data/shared-config';
import {
  type SimulationState,
  type Alert,
  drift,
  createAlert,
} from './shared-simulation';
import { generateCrew, tickCrew } from './crew';

// --- Phobos-specific interfaces ---

export interface DockingBay {
  id: string;
  occupied: boolean;
  vesselName: string;
  dockingTime: number;  // mission time when docked, 0 if empty
}

export interface FuelDepotData {
  ch4Reserves: number;   // kg, methane
  loxReserves: number;   // kg, liquid oxygen
  transferRate: number;  // kg/hr, current transfer
  status: SystemStatus;
}

export interface MarsRelayData {
  linkActive: boolean;
  dataTraffic: number;   // Mbps
  orbitalPhase: number;  // 0-1, position in ~7.66hr orbit
  signalQuality: number; // %, varies with orbital position
}

export interface PhobosDockingData {
  bays: DockingBay[];
  approachingVessel: string;
  eta: number;  // minutes, 0 if none
}

export interface PhobosFacilitiesData {
  fuelDepot: FuelDepotData;
  marsRelay: MarsRelayData;
  docking: PhobosDockingData;
}

export interface PhobosSimulationState extends Omit<SimulationState, 'facilities'> {
  facilities: PhobosFacilitiesData;
}

const VESSEL_NAMES = [
  'HERMES-IV', 'BRADBURY', 'PHOENIX-3', 'MARINER-12',
  'OLYMPUS', 'VALLES CLIPPER', 'BARSOOM', 'DEMOS EXPRESS',
];

export function createPhobosInitialState(): PhobosSimulationState {
  const initial = {
    missionDay: 178,
    missionTime: 36000, // 10:00
    atmosphere: { pressure: 101.3, o2: 21.0, co2: 430, humidity: 40 },
    water: { reserves: 20000, recyclingRate: 96, dailyConsumption: 90 },
    power: { solarGeneration: 60, batteryLevel: 82, consumption: 45 },
    comms: { earthLink: true, signalLatency: 780, bandwidth: 4.0 }, // ~13 min
    crew: { total: 6, evaActive: 0, medicalAlerts: 0 },
    crewRoster: [],
    radiation: { external: 0.15, shieldStatus: true },
    modules: [
      { id: 'command', status: 'nominal', temperature: 21.0 },
      { id: 'relay-comms', status: 'nominal', temperature: 20.5 },
      { id: 'lifesupport', status: 'nominal', temperature: 21.5 },
      { id: 'fuel-depot', status: 'nominal', temperature: 18.0 },
      { id: 'power', status: 'nominal', temperature: 20.0 },
      { id: 'habitation', status: 'nominal', temperature: 22.0 },
      { id: 'comms', status: 'nominal', temperature: 20.0 },
      { id: 'medical', status: 'nominal', temperature: 21.0 },
      { id: 'airlock', status: 'nominal', temperature: 19.0 },
      { id: 'docking', status: 'nominal', temperature: 19.5 },
      { id: 'storage', status: 'nominal', temperature: 18.5 },
    ],
    facilities: {
      fuelDepot: { ch4Reserves: 45000, loxReserves: 120000, transferRate: 0, status: 'nominal' },
      marsRelay: { linkActive: true, dataTraffic: 12.5, orbitalPhase: 0.3, signalQuality: 85 },
      docking: {
        bays: [
          { id: 'bay-1', occupied: true, vesselName: 'HERMES-IV', dockingTime: 28800 },
          { id: 'bay-2', occupied: false, vesselName: '', dockingTime: 0 },
        ],
        approachingVessel: '',
        eta: 0,
      },
    },
    alerts: [
      createAlert('nominal', 'SYS', 'PHOBOS RELAY — Simulation initialized — all systems nominal', 178, 36000),
    ],
  } as PhobosSimulationState;
  initial.crewRoster = generateCrew('phobos', initial.crew.total, initial.modules.map(m => m.id));
  return initial;
}

export function phobosTick(state: PhobosSimulationState): { state: PhobosSimulationState; newAlerts: Alert[] } {
  const newAlerts: Alert[] = [];
  const s = structuredClone(state);

  s.missionTime += 60;
  if (s.missionTime >= 86400) { s.missionTime -= 86400; s.missionDay += 1; }

  // --- Mars relay ---
  // Orbital period ~7.66 hours = 27576 seconds
  s.facilities.marsRelay.orbitalPhase = (s.facilities.marsRelay.orbitalPhase + 60 / 27576) % 1;

  // Signal quality varies with orbital position (best at 0.5, worst at 0/1 — behind Mars)
  const phaseAngle = s.facilities.marsRelay.orbitalPhase * Math.PI * 2;
  const baseQuality = 50 + 45 * Math.sin(phaseAngle);
  s.facilities.marsRelay.signalQuality = Math.max(5, Math.min(98, baseQuality + (Math.random() - 0.5) * 10));

  if (s.facilities.marsRelay.signalQuality < 20) {
    if (s.facilities.marsRelay.linkActive) {
      s.facilities.marsRelay.linkActive = false;
      newAlerts.push(createAlert('warning', 'RLY', 'Mars relay signal lost — Phobos behind Mars', s.missionDay, s.missionTime));
    }
  } else if (!s.facilities.marsRelay.linkActive && s.facilities.marsRelay.signalQuality > 30) {
    s.facilities.marsRelay.linkActive = true;
    newAlerts.push(createAlert('nominal', 'RLY', 'Mars relay signal restored', s.missionDay, s.missionTime));
  }

  s.facilities.marsRelay.dataTraffic = s.facilities.marsRelay.linkActive
    ? drift(s.facilities.marsRelay.dataTraffic, 12.5, 0.03, 1, 0.5, 25)
    : 0;

  // --- Docking events ---
  // Random vessel approach
  if (!s.facilities.docking.approachingVessel && Math.random() < 0.002) {
    const available = VESSEL_NAMES.filter(v => !s.facilities.docking.bays.some(b => b.vesselName === v));
    if (available.length > 0) {
      s.facilities.docking.approachingVessel = available[Math.floor(Math.random() * available.length)];
      s.facilities.docking.eta = 15 + Math.floor(Math.random() * 30);
      newAlerts.push(createAlert('nominal', 'DCK', `Vessel ${s.facilities.docking.approachingVessel} on approach — ETA ${s.facilities.docking.eta} min`, s.missionDay, s.missionTime));
    }
  }

  // Countdown approach
  if (s.facilities.docking.approachingVessel && s.facilities.docking.eta > 0) {
    s.facilities.docking.eta--;
    if (s.facilities.docking.eta === 0) {
      const emptyBay = s.facilities.docking.bays.find(b => !b.occupied);
      if (emptyBay) {
        emptyBay.occupied = true;
        emptyBay.vesselName = s.facilities.docking.approachingVessel;
        emptyBay.dockingTime = s.missionTime;
        newAlerts.push(createAlert('nominal', 'DCK', `${s.facilities.docking.approachingVessel} docked at ${emptyBay.id}`, s.missionDay, s.missionTime));
      } else {
        newAlerts.push(createAlert('warning', 'DCK', `${s.facilities.docking.approachingVessel} — no bay available, holding orbit`, s.missionDay, s.missionTime));
      }
      s.facilities.docking.approachingVessel = '';
    }
  }

  // Random vessel departure
  const occupiedBays = s.facilities.docking.bays.filter(b => b.occupied);
  if (occupiedBays.length > 0 && Math.random() < 0.003) {
    const bay = occupiedBays[Math.floor(Math.random() * occupiedBays.length)];
    newAlerts.push(createAlert('nominal', 'DCK', `${bay.vesselName} departed ${bay.id}`, s.missionDay, s.missionTime));
    // Consume fuel on departure
    s.facilities.fuelDepot.ch4Reserves -= 2000 + Math.random() * 3000;
    s.facilities.fuelDepot.loxReserves -= 6000 + Math.random() * 8000;
    bay.occupied = false;
    bay.vesselName = '';
    bay.dockingTime = 0;
  }

  // --- Fuel depot ---
  // Slow refueling from ISRU shipments
  s.facilities.fuelDepot.ch4Reserves = drift(s.facilities.fuelDepot.ch4Reserves, 50000, 0.002, 50, 5000, 80000);
  s.facilities.fuelDepot.loxReserves = drift(s.facilities.fuelDepot.loxReserves, 140000, 0.002, 100, 15000, 200000);
  s.facilities.fuelDepot.transferRate = occupiedBays.length > 0 ? drift(s.facilities.fuelDepot.transferRate, 200, 0.05, 20, 0, 500) : 0;

  if (s.facilities.fuelDepot.ch4Reserves < 10000) {
    s.facilities.fuelDepot.status = 'warning';
    if (s.facilities.fuelDepot.ch4Reserves < 5000) {
      s.facilities.fuelDepot.status = 'critical';
      newAlerts.push(createAlert('critical', 'FUL', `CH₄ reserves critical: ${(s.facilities.fuelDepot.ch4Reserves / 1000).toFixed(1)}t`, s.missionDay, s.missionTime));
    }
  } else {
    s.facilities.fuelDepot.status = 'nominal';
  }

  // --- Atmosphere ---
  s.atmosphere.pressure = drift(s.atmosphere.pressure, 101.3, 0.02, 0.05, 98, 104);
  s.atmosphere.o2 = drift(s.atmosphere.o2, 21.0, 0.015, 0.03, 18, 23);
  s.atmosphere.co2 = drift(s.atmosphere.co2, 430, 0.01, 5, 300, 1000);
  s.atmosphere.humidity = drift(s.atmosphere.humidity, 40, 0.02, 0.3, 20, 65);

  // --- Water ---
  s.water.reserves = drift(s.water.reserves, 20000, 0.005, 8, 10000, 35000);

  // --- Power ---
  s.power.solarGeneration = drift(s.power.solarGeneration, 60, 0.03, 1, 20, 80);
  s.power.consumption = drift(s.power.consumption, 45, 0.02, 0.5, 25, 65);
  const powerBalance = s.power.solarGeneration - s.power.consumption;
  s.power.batteryLevel = Math.max(0, Math.min(100, s.power.batteryLevel + powerBalance * 0.003));

  // --- Comms (Earth link) ---
  if (s.comms.earthLink) {
    if (Math.random() < 0.001) {
      s.comms.earthLink = false;
      newAlerts.push(createAlert('warning', 'COM', 'Earth link interrupted — solar conjunction', s.missionDay, s.missionTime));
    }
    s.comms.signalLatency = drift(s.comms.signalLatency, 780, 0.02, 20, 240, 1200);
    s.comms.bandwidth = drift(s.comms.bandwidth, 4.0, 0.03, 0.2, 0.5, 8);
  } else {
    if (Math.random() < 0.01) {
      s.comms.earthLink = true;
      newAlerts.push(createAlert('nominal', 'COM', 'Earth link restored', s.missionDay, s.missionTime));
    }
  }

  // --- Module temperatures ---
  s.modules = s.modules.map(m => ({
    ...m,
    temperature: drift(m.temperature, m.id === 'fuel-depot' ? 18 : m.id === 'airlock' ? 19 : 21, 0.02, 0.08, 14, 28),
  }));

  // --- Random events ---
  if (Math.random() < 0.005) {
    const events = [
      createAlert('nominal', 'RLY', `Mars relay traffic: ${s.facilities.marsRelay.dataTraffic.toFixed(1)} Mbps — nominal`, s.missionDay, s.missionTime),
      createAlert('nominal', 'HAB', 'Crew fitness session — microgravity routine', s.missionDay, s.missionTime),
      createAlert('nominal', 'CMD', `Phobos surface EVA window open — Mars elevation ${(35 + Math.random() * 20).toFixed(0)}°`, s.missionDay, s.missionTime),
      createAlert('nominal', 'MED', 'Crew health check — all nominal', s.missionDay, s.missionTime),
      createAlert('nominal', 'STR', 'Supply inventory updated', s.missionDay, s.missionTime),
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
    if (m.id === 'relay-comms' && !s.facilities.marsRelay.linkActive) status = 'warning';
    if (m.id === 'fuel-depot') status = s.facilities.fuelDepot.status;
    return { ...m, status };
  });

  s.alerts = [...s.alerts, ...newAlerts].slice(-50);
  return { state: s, newAlerts };
}
