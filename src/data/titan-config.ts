import type { JunctionConfig, ModuleConfig } from './shared-config';

// --- HUYGENS OUTPOST ---
// 6-person outpost on Titan, near Kraken Mare methane lake
// Compact layout with 4-unit spacing
//
// Row 0 (z=0):  j1[0,0]   j2[4,0]   j3[8,0]    — Operations
// Row 1 (z=4):  j4[0,4]   j5[4,4]   j6[8,4]    — Habitation/Science
// Row 2 (z=8):            j7[4,8]                — Industrial access

export const titanJunctions: JunctionConfig[] = [
  // Row 0 — operations
  { id: 'j1', position: [0, 0],  ports: ['east', 'south'] },
  { id: 'j2', position: [4, 0],  ports: ['east', 'south', 'west'] },
  { id: 'j3', position: [8, 0],  ports: ['north', 'south', 'west'] },
  // Row 1 — habitation/science
  { id: 'j4', position: [0, 4],  ports: ['north', 'east', 'south'] },
  { id: 'j5', position: [4, 4],  ports: ['north', 'east', 'south', 'west'] },
  { id: 'j6', position: [8, 4],  ports: ['north', 'west'] },
  // Row 2 — industrial access
  { id: 'j7', position: [4, 8],  ports: ['north', 'east', 'south'] },
];

export const titanModules: ModuleConfig[] = [
  // === Row 0 spanning (operations) ===
  {
    id: 'command', name: 'Mission Control', shortName: 'CMD',
    description: 'Central operations and Huygens mission coordination', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'comms', name: 'Deep Space Comms', shortName: 'COM',
    description: 'Saturn relay and Earth uplink antenna array', size: 1.1,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },

  // === Row 0→1 vertical ===
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing with N₂/CH₄ filtration', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j4', port: 'north' },
  },
  {
    id: 'storage', name: 'Supply Storage', shortName: 'STR',
    description: 'Primary cargo storage and supply depot', size: 0.9,
    from: { junction: 'j2', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'power', name: 'Power Control', shortName: 'PWR',
    description: 'RTG and Stirling engine power management', size: 1.0,
    from: { junction: 'j3', port: 'south' },
    to: { junction: 'j6', port: 'north' },
  },

  // === Row 1 spanning (habitation/science) ===
  {
    id: 'habitation', name: 'Habitation Module', shortName: 'HAB',
    description: 'Crew quarters for 6 — insulated against -179°C exterior', size: 1.1,
    from: { junction: 'j4', port: 'east' },
    to: { junction: 'j5', port: 'west' },
  },
  {
    id: 'research', name: 'Cryogenics Lab', shortName: 'LAB',
    description: 'Titan surface chemistry and prebiotic molecule analysis', size: 1.0,
    from: { junction: 'j5', port: 'east' },
    to: { junction: 'j6', port: 'west' },
  },

  // === Row 1→2 vertical ===
  {
    id: 'atmo-processor', name: 'Atmo Processor', shortName: 'ATP',
    description: 'Filters Titan N₂/CH₄ atmosphere for base gas supply', size: 1.0,
    from: { junction: 'j4', port: 'south' }, to: null,
  },
  {
    id: 'passage1', name: 'South Passage', shortName: 'SP1',
    description: 'Transit corridor to southern industrial sector', size: 0.7,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j7', port: 'north' },
  },

  // === Dead-end modules ===
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Emergency medical and crew health monitoring', size: 1.0,
    from: { junction: 'j7', port: 'east' }, to: null,
  },
  {
    id: 'airlock', name: 'EVA Airlock', shortName: 'ALK',
    description: 'Surface access with heated suit staging', size: 0.8,
    from: { junction: 'j7', port: 'south' }, to: null,
  },
  {
    id: 'cryo-lab', name: 'Cryo Research', shortName: 'CRY',
    description: 'Ultra-low temperature material experiments', size: 0.9,
    from: { junction: 'j3', port: 'north' }, to: null,
  },
];
