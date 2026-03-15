import type { JunctionConfig, ModuleConfig } from './shared-config';

// --- EUROPA DEEP ---
// 8-person research station, heavily shielded against Jupiter radiation
// Compact, subsurface-oriented layout with 4-unit spacing
//
// Row 0 (z=0):  j1[0,0]   j2[4,0]   j3[8,0]    — Operations/Comms
// Row 1 (z=4):  j4[0,4]   j5[4,4]   j6[8,4]    — Science/Habitation
// Row 2 (z=8):            j7[4,8]   j8[8,8]     — Industrial/Access

export const europaJunctions: JunctionConfig[] = [
  // Row 0 — operations
  { id: 'j1', position: [0, 0],  ports: ['east', 'south'] },
  { id: 'j2', position: [4, 0],  ports: ['east', 'south', 'west'] },
  { id: 'j3', position: [8, 0],  ports: ['north', 'south', 'west'] },
  // Row 1 — science/habitation
  { id: 'j4', position: [0, 4],  ports: ['north', 'east', 'south'] },
  { id: 'j5', position: [4, 4],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [8, 4],  ports: ['north', 'west'] },
  // Row 2 — industrial
  { id: 'j7', position: [4, 8],  ports: ['north', 'east'] },
  { id: 'j8', position: [8, 8],  ports: ['north', 'east', 'south', 'west'] },
];

export const europaModules: ModuleConfig[] = [
  // === Row 0 spanning ===
  {
    id: 'command', name: 'Mission Control', shortName: 'CMD',
    description: 'Central operations and Jupiter system coordination', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'comms', name: 'Deep Space Comms', shortName: 'COM',
    description: 'Jupiter relay and Earth communications', size: 1.1,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // === Row 0→1 vertical ===
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing and environmental control', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'storage', name: 'Supply Storage', shortName: 'STR',
    description: 'Radiation-hardened supply depot', size: 0.9,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'rad-shield', name: 'Radiation Shield', shortName: 'RAD',
    description: 'Active radiation shielding and monitoring systems', size: 1.0,
    from: { junction: 'j3', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // === Row 1 spanning ===
  {
    id: 'habitation', name: 'Habitation Module', shortName: 'HAB',
    description: 'Crew quarters — subsurface shielded living spaces', size: 1.1,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },
  {
    id: 'research', name: 'Astrobiology Lab', shortName: 'LAB',
    description: 'Ocean sample analysis and biosignature detection', size: 1.0,
    from: { junction: 'j5', port: 'east' },
    to: { junction: 'j6', port: 'west' },
  },

  // === Row 1→2 vertical ===
  {
    id: 'airlock', name: 'EVA Airlock', shortName: 'ALK',
    description: 'Surface access — radiation-hardened suit staging', size: 0.8,
    from: { junction: 'j4', port: 'south' }, to: null,
  },
  {
    id: 'passage1', name: 'Ice Corridor', shortName: 'SP1',
    description: 'Transit corridor to drill operations', size: 0.7,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j7', port: 'north' },
  },
  {
    id: 'power', name: 'Power Control', shortName: 'PWR',
    description: 'RTG array and power distribution', size: 1.0,
    from: { junction: 'j8', port: 'east' }, to: null,
  },

  // === Row 2 and dead-ends ===
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Radiation treatment and crew health monitoring', size: 1.0,
    from: { junction: 'j7', port: 'east' },
    to: { junction: 'j8', port: 'west' },
  },
  {
    id: 'docking', name: 'Surface Dock', shortName: 'DCK',
    description: 'Cargo receiving and lander interface', size: 0.9,
    from: { junction: 'j8', port: 'south' }, to: null,
  },
  {
    id: 'observatory', name: 'Jupiter Observatory', shortName: 'OBS',
    description: 'Jovian system monitoring and tidal tracking', size: 0.9,
    from: { junction: 'j3', port: 'north' }, to: null,
  },
];
