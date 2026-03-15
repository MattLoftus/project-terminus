import type { JunctionConfig, ModuleConfig } from './shared-config';

// --- APHRODITE AEROSTAT ---
// 8-person cloud station floating at 50km altitude in Venus atmosphere
// Compact with 4-unit spacing
//
// Row 0 (z=0):  j1[0,0]   j2[4,0]   j3[8,0]    — Operations
// Row 1 (z=4):  j4[0,4]   j5[4,4]   j6[8,4]    — Science/Habitation
// Row 2 (z=8):            j7[4,8]                — Access

export const venusJunctions: JunctionConfig[] = [
  { id: 'j1', position: [0, 0],  ports: ['north', 'east', 'south'] },
  { id: 'j2', position: [4, 0],  ports: ['east', 'south', 'west'] },
  { id: 'j3', position: [8, 0],  ports: ['south', 'west'] },
  { id: 'j4', position: [0, 4],  ports: ['north', 'east'] },
  { id: 'j5', position: [4, 4],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [8, 4],  ports: ['north', 'east', 'west'] },
  { id: 'j7', position: [4, 8],  ports: ['north', 'south', 'west'] },
];

export const venusModules: ModuleConfig[] = [
  // Row 0
  {
    id: 'command', name: 'Flight Control', shortName: 'CMD',
    description: 'Station altitude and navigation control', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'comms', name: 'Atmospheric Comms', shortName: 'COM',
    description: 'Earth relay through Venus atmosphere', size: 1.1,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // Row 0→1 vertical
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing with acid filtration', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'storage', name: 'Supply Storage', shortName: 'STR',
    description: 'Buoyant cargo storage and supplies', size: 0.9,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'power', name: 'Power Control', shortName: 'PWR',
    description: 'Wind turbine and solar power management', size: 1.0,
    from: { junction: 'j3', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // Row 1
  {
    id: 'habitation', name: 'Habitation Module', shortName: 'HAB',
    description: 'Crew quarters — near-Earth pressure and temperature', size: 1.1,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },
  {
    id: 'research', name: 'Atmosphere Lab', shortName: 'LAB',
    description: 'Venus atmospheric chemistry and cloud analysis', size: 1.0,
    from: { junction: 'j5', port: 'east' },
    to: { junction: 'j6', port: 'west' },
  },

  // Row 1→2
  {
    id: 'passage1', name: 'Lower Corridor', shortName: 'SP1',
    description: 'Transit corridor to lower station access', size: 0.7,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j7', port: 'north' },
  },

  // Dead-ends
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Acid burn treatment and crew health', size: 1.0,
    from: { junction: 'j7', port: 'south' }, to: null,
  },
  {
    id: 'airlock', name: 'EVA Airlock', shortName: 'ALK',
    description: 'Exterior gondola access for maintenance', size: 0.8,
    from: { junction: 'j7', port: 'west' }, to: null,
  },
  {
    id: 'atmo-sampler', name: 'Atmo Sampler', shortName: 'ATS',
    description: 'Cloud sampling and atmospheric composition analysis', size: 0.9,
    from: { junction: 'j6', port: 'east' }, to: null,
  },
  {
    id: 'observatory', name: 'Cloud Observatory', shortName: 'OBS',
    description: 'Venus surface imaging and cloud layer monitoring', size: 0.9,
    from: { junction: 'j1', port: 'north' }, to: null,
  },
];
