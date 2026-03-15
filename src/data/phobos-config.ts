import type { JunctionConfig, ModuleConfig } from './shared-config';

// --- PHOBOS RELAY ---
// 6-person relay station on Phobos (Mars moon)
// Compact layout with 3-unit spacing
//
// Row 0 (z=0):  j1[0,0]   j2[3,0]   j3[6,0]    — Operations
// Row 1 (z=3):  j4[0,3]   j5[3,3]                — Habitation
// Row 2 (z=6):            j6[3,6]                 — Access

export const phobosJunctions: JunctionConfig[] = [
  { id: 'j1', position: [0, 0],  ports: ['east', 'south'] },
  { id: 'j2', position: [3, 0],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j3', position: [6, 0],  ports: ['south', 'west'] },
  { id: 'j4', position: [0, 3],  ports: ['north', 'east'] },
  { id: 'j5', position: [3, 3],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [3, 6],  ports: ['north', 'south', 'west'] },
];

export const phobosModules: ModuleConfig[] = [
  // Row 0
  {
    id: 'command', name: 'Command Center', shortName: 'CMD',
    description: 'Station operations and relay management', size: 1.1,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'relay-comms', name: 'Relay Comms', shortName: 'RLY',
    description: 'Mars-Earth relay antenna control', size: 1.0,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // Row 0→1 vertical
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric recycling and CO₂ scrubbing', size: 0.9,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'fuel-depot', name: 'Fuel Depot', shortName: 'FUL',
    description: 'CH₄/LOX storage and transfer', size: 1.0,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'power', name: 'Power Systems', shortName: 'PWR',
    description: 'Solar array and battery management', size: 0.9,
    from: { junction: 'j3', port: 'south' },
    to: null,
  },

  // Row 1
  {
    id: 'habitation', name: 'Habitation Module', shortName: 'HAB',
    description: 'Crew quarters for 6', size: 1.0,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },

  // Row 1→2
  {
    id: 'comms', name: 'Comms Hub', shortName: 'COM',
    description: 'Deep space and Mars surface communications', size: 0.9,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // Dead-ends
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Crew medical and fitness', size: 0.8,
    from: { junction: 'j6', port: 'south' }, to: null,
  },
  {
    id: 'airlock', name: 'EVA Airlock', shortName: 'ALK',
    description: 'Surface EVA access', size: 0.7,
    from: { junction: 'j6', port: 'west' }, to: null,
  },
  {
    id: 'docking', name: 'Docking Port', shortName: 'DCK',
    description: 'Spacecraft docking and cargo transfer', size: 1.0,
    from: { junction: 'j2', port: 'north' }, to: null,
  },
  {
    id: 'storage', name: 'Storage', shortName: 'STR',
    description: 'Equipment and supply storage', size: 0.8,
    from: { junction: 'j5', port: 'east' }, to: null,
  },
];
