import type { JunctionConfig, ModuleConfig } from './shared-config';

// Re-export everything from shared-config for backwards compatibility
export * from './shared-config';

// --- Junction grid (4-unit spacing) ---
// Row 0 (z=0): main operations
// Row 1 (z=4): habitation wing
// Row 2 (z=8): agricultural wing
// Row 3 (z=12): southern perimeter / industrial access

export const junctions: JunctionConfig[] = [
  // Row 0 — operations
  { id: 'j1', position: [0, 0],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j2', position: [4, 0],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j3', position: [8, 0],  ports: ['east', 'south', 'west'] },
  // Row 1 — habitation
  { id: 'j4', position: [0, 4],  ports: ['north', 'east', 'south'] },
  { id: 'j5', position: [4, 4],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [8, 4],  ports: ['north', 'east', 'south', 'west'] },
  // Row 2 — agricultural
  { id: 'j7',  position: [0, 8],  ports: ['north', 'east', 'south'] },
  { id: 'j8',  position: [4, 8],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j9',  position: [8, 8],  ports: ['north', 'east', 'west'] },
  // Row 3 — southern perimeter
  { id: 'j10', position: [0, 12], ports: ['north', 'east', 'south'] },
  { id: 'j11', position: [4, 12], ports: ['north', 'east', 'west'] },
];

// --- Modules ---

export const modules: ModuleConfig[] = [
  // === Row 0 spanning (operations) ===
  {
    id: 'command', name: 'Command Center', shortName: 'CMD',
    description: 'Central operations and mission control', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'research', name: 'Research Lab', shortName: 'LAB',
    description: 'Science experiments and analysis', size: 1.0,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // === Row 0↔1 vertical spanning ===
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing and water recycling', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'greenhouse', name: 'Greenhouse Alpha', shortName: 'GRN',
    description: 'Primary agricultural dome', size: 1.0,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'storage', name: 'Storage Bay', shortName: 'STR',
    description: 'Cargo storage and logistics', size: 0.9,
    from: { junction: 'j3', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // === Row 1 spanning (habitation) ===
  {
    id: 'habitation', name: 'Habitation', shortName: 'HAB',
    description: 'Crew quarters and recreation', size: 1.1,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },
  {
    id: 'recreation', name: 'Recreation', shortName: 'REC',
    description: 'Fitness and crew morale facilities', size: 0.9,
    from: { junction: 'j5', port: 'east' },
    to: { junction: 'j6', port: 'west' },
  },

  // === Row 1↔2 vertical spanning ===
  {
    id: 'bioprocessing', name: 'Bio-Processing', shortName: 'BIO',
    description: 'Biological waste processing and composting', size: 0.9,
    from: { junction: 'j4', port: 'south' },
    to: { junction: 'j7', port: 'north' },
  },
  {
    id: 'logistics', name: 'Logistics Hub', shortName: 'LOG',
    description: 'Central transit and cargo routing', size: 1.0,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j8', port: 'north' },
  },
  {
    id: 'fabrication', name: 'Fabrication Bay', shortName: 'MFG',
    description: 'Additive manufacturing and assembly', size: 1.0,
    from: { junction: 'j6', port: 'south' },
    to: { junction: 'j9', port: 'north' },
  },

  // === Row 2 spanning (agricultural) ===
  {
    id: 'greenhouse2', name: 'Greenhouse Beta', shortName: 'GR2',
    description: 'Secondary agricultural dome — grains and legumes', size: 1.0,
    from: { junction: 'j7', port: 'east' },
    to: { junction: 'j8', port: 'west' },
  },
  {
    id: 'greenhouse3', name: 'Greenhouse Gamma', shortName: 'GR3',
    description: 'Tertiary agricultural dome — root vegetables', size: 1.0,
    from: { junction: 'j8', port: 'east' },
    to: { junction: 'j9', port: 'west' },
  },

  // === Row 2↔3 vertical spanning ===
  {
    id: 'passage1', name: 'South Passage A', shortName: 'SP1',
    description: 'Transit corridor to southern perimeter', size: 0.7,
    from: { junction: 'j7', port: 'south' },
    to: { junction: 'j10', port: 'north' },
  },
  {
    id: 'passage2', name: 'South Passage B', shortName: 'SP2',
    description: 'Transit corridor to docking sector', size: 0.7,
    from: { junction: 'j8', port: 'south' },
    to: { junction: 'j11', port: 'north' },
  },

  // === Dead-end modules ===
  {
    id: 'comms', name: 'Communications', shortName: 'COM',
    description: 'Earth uplink and relay systems', size: 0.9,
    from: { junction: 'j1', port: 'north' }, to: null,
  },
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Health monitoring and treatment', size: 0.9,
    from: { junction: 'j1', port: 'west' }, to: null,
  },
  {
    id: 'observatory', name: 'Observatory', shortName: 'OBS',
    description: 'Astronomical observation and tracking', size: 0.9,
    from: { junction: 'j2', port: 'north' }, to: null,
  },
  {
    id: 'workshop', name: 'Workshop', shortName: 'FAB',
    description: 'Fabrication and equipment repair', size: 0.9,
    from: { junction: 'j3', port: 'east' }, to: null,
  },
  {
    id: 'power', name: 'Power Station', shortName: 'PWR',
    description: 'Solar array control and battery storage', size: 1.0,
    from: { junction: 'j6', port: 'east' }, to: null,
  },
  {
    id: 'storage2', name: 'Storage Bay B', shortName: 'ST2',
    description: 'Overflow cargo and equipment storage', size: 0.9,
    from: { junction: 'j9', port: 'east' }, to: null,
  },
  {
    id: 'airlock', name: 'Airlock', shortName: 'ALK',
    description: 'EVA staging and surface access', size: 0.8,
    from: { junction: 'j10', port: 'south' }, to: null,
  },
  {
    id: 'docking', name: 'Docking Port', shortName: 'DCK',
    description: 'Cargo receiving and supply lander interface', size: 0.9,
    from: { junction: 'j11', port: 'east' }, to: null,
  },
];
