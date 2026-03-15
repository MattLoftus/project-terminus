import type { JunctionConfig, ModuleConfig } from './shared-config';

// --- DAWN STATION ---
// 10-person mining outpost on Ceres (dwarf planet in asteroid belt)
// Compact with 4-unit spacing, mining-focused layout
//
// Row 0 (z=0):  j1[0,0]   j2[4,0]   j3[8,0]    — Operations
// Row 1 (z=4):  j4[0,4]   j5[4,4]   j6[8,4]    — Habitation
// Row 2 (z=8):            j7[4,8]                — Industrial

export const ceresJunctions: JunctionConfig[] = [
  { id: 'j1', position: [0, 0],  ports: ['north', 'east', 'south'] },
  { id: 'j2', position: [4, 0],  ports: ['east', 'south', 'west'] },
  { id: 'j3', position: [8, 0],  ports: ['south', 'west'] },
  { id: 'j4', position: [0, 4],  ports: ['north', 'east', 'south'] },
  { id: 'j5', position: [4, 4],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [8, 4],  ports: ['north', 'east', 'west'] },
  { id: 'j7', position: [4, 8],  ports: ['north', 'east', 'south'] },
];

export const ceresModules: ModuleConfig[] = [
  // Row 0 spanning
  {
    id: 'command', name: 'Mission Control', shortName: 'CMD',
    description: 'Central operations and asteroid belt navigation', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'comms', name: 'Deep Space Comms', shortName: 'COM',
    description: 'Earth relay and belt navigation beacons', size: 1.1,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // Row 0→1 vertical
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing and environmental control', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'storage', name: 'Supply Storage', shortName: 'STR',
    description: 'Cargo storage and ore stockpile management', size: 0.9,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'power', name: 'Power Control', shortName: 'PWR',
    description: 'Solar array and RTG power management', size: 1.0,
    from: { junction: 'j3', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // Row 1 spanning
  {
    id: 'habitation', name: 'Habitation Module', shortName: 'HAB',
    description: 'Crew quarters with spin-gravity access', size: 1.1,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },
  {
    id: 'research', name: 'Geology Lab', shortName: 'LAB',
    description: 'Asteroid mineralogy and ore composition analysis', size: 1.0,
    from: { junction: 'j5', port: 'east' },
    to: { junction: 'j6', port: 'west' },
  },

  // Row 1→2 vertical
  {
    id: 'passage1', name: 'Mining Corridor', shortName: 'SP1',
    description: 'Transit corridor to mining operations', size: 0.7,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j7', port: 'north' },
  },

  // Dead-end modules
  {
    id: 'airlock', name: 'EVA Airlock', shortName: 'ALK',
    description: 'Low-gravity surface access and suit staging', size: 0.8,
    from: { junction: 'j4', port: 'south' }, to: null,
  },
  {
    id: 'spin-gravity', name: 'Spin Module', shortName: 'SPN',
    description: 'Centrifuge for crew health — 0.3g artificial gravity', size: 1.0,
    from: { junction: 'j6', port: 'east' }, to: null,
  },
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Medical facilities and low-g health management', size: 1.0,
    from: { junction: 'j7', port: 'east' }, to: null,
  },
  {
    id: 'docking', name: 'Cargo Dock', shortName: 'DCK',
    description: 'Mass driver payload receiving and cargo interface', size: 0.9,
    from: { junction: 'j7', port: 'south' }, to: null,
  },
  {
    id: 'observatory', name: 'Belt Observatory', shortName: 'OBS',
    description: 'Asteroid tracking and approach monitoring', size: 0.9,
    from: { junction: 'j1', port: 'north' }, to: null,
  },
];
