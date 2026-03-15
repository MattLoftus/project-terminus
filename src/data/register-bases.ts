/**
 * Registers all bases with the base registry.
 * Import this module once at app startup (e.g., in App.tsx) to populate the registry.
 */
import { registerBase } from './base-registry';
import { junctions as moonJunctions, modules as moonModules } from './moon-config';
import { marsJunctions, marsModules } from './mars-config';
import { titanJunctions, titanModules } from './titan-config';
import { europaJunctions, europaModules } from './europa-config';
import { ceresJunctions, ceresModules } from './ceres-config';
import { venusJunctions, venusModules } from './venus-config';
import { phobosJunctions, phobosModules } from './phobos-config';
import { createMoonInitialState, moonTick } from '../lib/moon-simulation';
import { createMarsInitialState, marsTick } from '../lib/mars-simulation';
import { createTitanInitialState, titanTick } from '../lib/titan-simulation';
import { createEuropaInitialState, europaTick } from '../lib/europa-simulation';
import { createCeresInitialState, ceresTick } from '../lib/ceres-simulation';
import { createVenusInitialState, venusTick } from '../lib/venus-simulation';
import { createPhobosInitialState, phobosTick } from '../lib/phobos-simulation';
import type { SimulationState } from '../lib/shared-simulation';
import type { MarsSimulationState } from '../lib/mars-simulation';
import type { TitanSimulationState } from '../lib/titan-simulation';
import type { EuropaSimulationState } from '../lib/europa-simulation';
import type { CeresSimulationState } from '../lib/ceres-simulation';
import type { VenusSimulationState } from '../lib/venus-simulation';
import type { PhobosSimulationState } from '../lib/phobos-simulation';
import { MoonScene } from '../components/base-map/MoonScene';
import { MarsScene } from '../components/base-map/MarsScene';
import { TitanScene } from '../components/base-map/TitanScene';
import { EuropaScene } from '../components/base-map/EuropaScene';
import { CeresScene } from '../components/base-map/CeresScene';
import { VenusScene } from '../components/base-map/VenusScene';
import { PhobosScene } from '../components/base-map/PhobosScene';
import { WeatherPanel } from '../components/panels/WeatherPanel';
import { MoxiePanel } from '../components/panels/MoxiePanel';
import { TitanAtmospherePanel } from '../components/panels/TitanAtmospherePanel';
import { EuropaRadiationPanel } from '../components/panels/EuropaRadiationPanel';
import { MiningPanel } from '../components/panels/MiningPanel';
import { AltitudePanel } from '../components/panels/AltitudePanel';
import { RelayPanel } from '../components/panels/RelayPanel';
import { MoonPlanet } from '../components/base-map/planets/MoonPlanet';
import { MarsPlanet } from '../components/base-map/planets/MarsPlanet';
import { TitanPlanet } from '../components/base-map/planets/TitanPlanet';
import { EuropaPlanet } from '../components/base-map/planets/EuropaPlanet';
import { CeresPlanet } from '../components/base-map/planets/CeresPlanet';
import { VenusPlanet } from '../components/base-map/planets/VenusPlanet';
import { PhobosPlanet } from '../components/base-map/planets/PhobosPlanet';
import { CeresMiningCampScene } from '../components/base-map/CeresMiningCampScene';

// ---------------------------------------------------------------------------
// Moon — ARTEMIS BASE
// ---------------------------------------------------------------------------

registerBase({
  type: 'moon',
  name: 'ARTEMIS BASE',
  subtitle: 'Luna',
  bgColor: '#060a12',
  junctions: moonJunctions,
  modules: moonModules,
  createInitialState: () => createMoonInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = moonTick(state as unknown as SimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',          target: [8, 0, 10],  offset: [0, 22, 18] },
    { name: 'Operations',        target: [4, 0, 0],   offset: [0, 6, 6] },
    { name: 'Agricultural Wing', target: [4, 0, 8],   offset: [0, 6, 6] },
    { name: 'Industrial Zone',   target: [12, 0, 14], offset: [0, 8, 8] },
    { name: 'Launch Pads',       target: [-8, 0, 19], offset: [0, 6, 8] },
    { name: 'Nuclear Reactor',   target: [12, 0, 22], offset: [0, 6, 6] },
    { name: 'ISRU Plant',        target: [12, 0, 12], offset: [0, 6, 6] },
    { name: 'Mining Site',       target: [27, 0, 10], offset: [0, 8, 8] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', RAD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', GRN: 'greenhouse',
    GR2: 'greenhouse2', GR3: 'greenhouse3', HAB: 'habitation', MED: 'medical',
    OBS: 'observatory', FAB: 'workshop', STR: 'storage', ST2: 'storage2',
    BIO: 'bioprocessing', MFG: 'fabrication', LOG: 'logistics', DCK: 'docking',
    REC: 'recreation', NUK: 'facility-reactor', ISRU: 'facility-isru', PAD: 'facility-pad-1',
  },
  facilityPositions: {
    'facility-reactor': [12, 0, 22],
    'facility-isru': [12, 0, 12],
    'facility-pad-1': [-3, 0, 19],
  },
  viewpointLabels: ['Overview', 'Ops', 'Agri', 'Industrial', 'Pads', 'Reactor', 'ISRU', 'Mining'],
  Scene: MoonScene,
  PlanetScene: MoonPlanet,
});

// ---------------------------------------------------------------------------
// Mars — ARES STATION
// ---------------------------------------------------------------------------

registerBase({
  type: 'mars',
  name: 'ARES STATION',
  subtitle: 'Mars',
  bgColor: '#1a0e08',
  junctions: marsJunctions,
  modules: marsModules,
  createInitialState: () => createMarsInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = marsTick(state as unknown as MarsSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',       target: [8, 0, 11], offset: [0, 30, 20] },
    { name: 'Central Dome',   target: [7.5, 0, 7.5], offset: [0, 8, 8] },
    { name: 'Operations',     target: [7.5, 0, 0],   offset: [0, 8, 8] },
    { name: 'Agriculture',    target: [0, 0, 10],    offset: [0, 8, 8] },
    { name: 'Industrial',     target: [5, 0, 15],    offset: [0, 8, 8] },
    { name: 'Reactor',        target: [18, 0, 24],   offset: [0, 8, 8] },
    { name: 'Ice Mine',       target: [20, 0, 12],   offset: [0, 8, 8] },
    { name: 'Landing Field',  target: [-6, 0, 22],   offset: [0, 8, 10] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', RAD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', GRN: 'greenhouse',
    GR2: 'greenhouse2', GR4: 'greenhouse4',
    HAB: 'habitation', MED: 'medical', OBS: 'observatory',
    STR: 'storage', BIO: 'bioprocessing', DOME: 'dome',
    DCK: 'docking',
    NUK: 'facility-reactor', MOX: 'moxie', SAB: 'facility-sabatier',
    ICE: 'facility-icemine', LND: 'facility-landing', WTH: 'facility-weather',
    GAR: 'garagebay', QRN: 'quarantine', SYS: 'command',
    H2O: 'waterprocessing',
  },
  facilityPositions: {
    'facility-reactor': [18, 0, 24],
    'facility-sabatier': [10, 0, 20],
    'facility-icemine': [20, 0, 12],
    'facility-landing': [-6, 0, 22],
    'facility-weather': [-3, 0, 0],
    'facility-wind': [-6, 0, 6],
  },
  viewpointLabels: ['Overview', 'Dome', 'Ops', 'Agri', 'Industrial', 'Reactor', 'Ice Mine', 'Landing'],
  Scene: MarsScene,
  PlanetScene: MarsPlanet,
  leftPanels: [WeatherPanel],
  rightPanels: [MoxiePanel],
});

// ---------------------------------------------------------------------------
// Titan — HUYGENS OUTPOST
// ---------------------------------------------------------------------------

registerBase({
  type: 'titan',
  name: 'HUYGENS OUTPOST',
  subtitle: 'Titan',
  bgColor: '#0e0a04',
  junctions: titanJunctions,
  modules: titanModules,
  createInitialState: () => createTitanInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = titanTick(state as unknown as TitanSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',        target: [4, 0, 4],   offset: [0, 20, 16] },
    { name: 'Operations',      target: [4, 0, 0],   offset: [0, 6, 6] },
    { name: 'Habitation',      target: [2, 0, 4],   offset: [0, 6, 6] },
    { name: 'Methane Lake',    target: [-8, 0, 8],  offset: [0, 6, 8] },
    { name: 'Cryo Power',      target: [12, 0, 4],  offset: [0, 6, 6] },
    { name: 'Reactor',         target: [12, 0, 8],  offset: [0, 6, 6] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', CMD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', HAB: 'habitation',
    MED: 'medical', STR: 'storage', ATP: 'atmo-processor', CRY: 'cryo-lab',
    NUK: 'facility-reactor', MTH: 'facility-harvester', SYS: 'command',
    WTH: 'facility-atmoprocessor',
  },
  facilityPositions: {
    'facility-reactor': [12, 0, 8],
    'facility-harvester': [-4, 0, 8],
    'facility-cryopower': [12, 0, 4],
    'facility-atmoprocessor': [12, 0, 0],
  },
  viewpointLabels: ['Overview', 'Ops', 'Hab', 'Lake', 'Cryo', 'Reactor'],
  Scene: TitanScene,
  PlanetScene: TitanPlanet,
  leftPanels: [TitanAtmospherePanel],
});

// ---------------------------------------------------------------------------
// Europa — EUROPA DEEP
// ---------------------------------------------------------------------------

registerBase({
  type: 'europa',
  name: 'EUROPA DEEP',
  subtitle: 'Europa',
  bgColor: '#040810',
  junctions: europaJunctions,
  modules: europaModules,
  createInitialState: () => createEuropaInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = europaTick(state as unknown as EuropaSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',       target: [4, 0, 4],   offset: [0, 18, 14] },
    { name: 'Operations',     target: [4, 0, 0],   offset: [0, 6, 6] },
    { name: 'Science Wing',   target: [4, 0, 4],   offset: [0, 6, 6] },
    { name: 'Ice Drill',      target: [14, 0, 4],  offset: [0, 6, 6] },
    { name: 'Reactor',        target: [14, 0, 8],  offset: [0, 6, 6] },
    { name: 'Jupiter View',   target: [-10, 0, 0], offset: [0, 8, 10] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', CMD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', HAB: 'habitation',
    MED: 'medical', STR: 'storage', RAD: 'rad-shield', OBS: 'observatory',
    DCK: 'docking', NUK: 'facility-reactor', DRL: 'facility-drill',
    TDL: 'facility-drill', PRB: 'facility-drill', SYS: 'command',
  },
  facilityPositions: {
    'facility-reactor': [14, 0, 8],
    'facility-drill': [14, 0, 4],
  },
  viewpointLabels: ['Overview', 'Ops', 'Science', 'Drill', 'Reactor', 'Jupiter'],
  Scene: EuropaScene,
  PlanetScene: EuropaPlanet,
  leftPanels: [EuropaRadiationPanel],
});

// ---------------------------------------------------------------------------
// Ceres — DAWN STATION
// ---------------------------------------------------------------------------

registerBase({
  type: 'ceres',
  name: 'DAWN STATION',
  subtitle: 'Ceres',
  bgColor: '#040406',
  junctions: ceresJunctions,
  modules: ceresModules,
  createInitialState: () => createCeresInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = ceresTick(state as unknown as CeresSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',       target: [4, 0, 4],   offset: [0, 18, 14] },
    { name: 'Operations',     target: [4, 0, 0],   offset: [0, 6, 6] },
    { name: 'Habitation',     target: [2, 0, 4],   offset: [0, 6, 6] },
    { name: 'Mining Area',    target: [14, 0, 2],  offset: [0, 8, 8] },
    { name: 'Mass Driver',    target: [-4, 0, 4],  offset: [0, 6, 8] },
    { name: 'Reactor',        target: [12, 0, 8],  offset: [0, 6, 6] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', CMD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', HAB: 'habitation',
    MED: 'medical', STR: 'storage', OBS: 'observatory', DCK: 'docking',
    SPN: 'spin-gravity', NUK: 'facility-reactor', MNG: 'facility-mining',
    MDR: 'facility-massdriver', SYS: 'command',
  },
  facilityPositions: {
    'facility-reactor': [12, 0, 8],
    'facility-mining': [14, 0, 2],
    'facility-massdriver': [-4, 0, 4],
  },
  viewpointLabels: ['Overview', 'Ops', 'Hab', 'Mining', 'Driver', 'Reactor'],
  Scene: CeresScene,
  PlanetScene: CeresPlanet,
  rightPanels: [MiningPanel],
  subviews: [{
    id: 'mining-camp',
    name: 'Remote Mining Camp',
    shortName: 'CAMP',
    description: 'Autonomous mining operation — 12km from main station',
    Scene: CeresMiningCampScene,
    bookmarks: [
      { name: 'Overview', target: [3, 0, 2], offset: [0, 10, 8] },
      { name: 'Drill Site', target: [4, 0, 1], offset: [0, 4, 4] },
    ],
  }],
});

// ---------------------------------------------------------------------------
// Venus — APHRODITE AEROSTAT
// ---------------------------------------------------------------------------

registerBase({
  type: 'venus',
  name: 'APHRODITE AEROSTAT',
  subtitle: 'Venus',
  bgColor: '#1a1408',
  junctions: venusJunctions,
  modules: venusModules,
  createInitialState: () => createVenusInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = venusTick(state as unknown as VenusSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',       target: [4, 0, 4],   offset: [0, 18, 14] },
    { name: 'Operations',     target: [4, 0, 0],   offset: [0, 6, 6] },
    { name: 'Habitation',     target: [2, 0, 4],   offset: [0, 6, 6] },
    { name: 'Observatory',    target: [0, 0, -1],   offset: [0, 6, 6] },
    { name: 'Atmo Sampler',   target: [9, 0, 4],   offset: [0, 6, 6] },
    { name: 'Airlock',        target: [4, 0, 9],   offset: [0, 6, 6] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', CMD: 'command',
    EVA: 'airlock', ALK: 'airlock', LAB: 'research', HAB: 'habitation',
    MED: 'medical', STR: 'storage', ATS: 'atmo-sampler', OBS: 'observatory',
    ALT: 'command', WND: 'power', ACD: 'lifesupport', SYS: 'command',
  },
  facilityPositions: {},
  viewpointLabels: ['Overview', 'Ops', 'Hab', 'Observatory', 'Sampler', 'Airlock'],
  Scene: VenusScene,
  PlanetScene: VenusPlanet,
  leftPanels: [AltitudePanel],
});

// ---------------------------------------------------------------------------
// Phobos — PHOBOS RELAY
// ---------------------------------------------------------------------------

registerBase({
  type: 'phobos',
  name: 'PHOBOS RELAY',
  subtitle: 'Phobos',
  bgColor: '#0a0608',
  junctions: phobosJunctions,
  modules: phobosModules,
  createInitialState: () => createPhobosInitialState() as unknown as Record<string, unknown>,
  tick: (state) => {
    const result = phobosTick(state as unknown as PhobosSimulationState);
    return { state: result.state as unknown as Record<string, unknown>, newAlerts: result.newAlerts };
  },
  bookmarks: [
    { name: 'Overview',       target: [3, 0, 3],   offset: [0, 16, 12] },
    { name: 'Operations',     target: [3, 0, 0],   offset: [0, 6, 6] },
    { name: 'Habitation',     target: [1.5, 0, 3],  offset: [0, 6, 6] },
    { name: 'Relay Antenna',  target: [7, 0, -2],  offset: [0, 6, 6] },
    { name: 'Fuel Depot',     target: [-2, 0, 5],  offset: [0, 6, 6] },
    { name: 'Docking',        target: [3, 0, -2],  offset: [0, 6, 6] },
  ],
  systemMap: {
    ATM: 'lifesupport', PWR: 'power', COM: 'comms', CMD: 'command',
    EVA: 'airlock', ALK: 'airlock', HAB: 'habitation', MED: 'medical',
    STR: 'storage', RLY: 'relay-comms', FUL: 'fuel-depot', DCK: 'docking',
    SYS: 'command',
  },
  facilityPositions: {
    'facility-relay': [7, 0, -2],
    'facility-fueldepot': [-2, 0, 5],
  },
  viewpointLabels: ['Overview', 'Ops', 'Hab', 'Antenna', 'Fuel', 'Docking'],
  Scene: PhobosScene,
  PlanetScene: PhobosPlanet,
  leftPanels: [RelayPanel],
});
