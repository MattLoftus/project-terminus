import type { JunctionConfig, ModuleConfig } from './shared-config';

// Re-export everything from shared-config for backwards compatibility
export * from './shared-config';

// --- ARES STATION ---
// 16-person outpost in Acidalia Planitia, Mars
// Junction grid uses 5-unit spacing (wider than Moon's 4-unit)
//
// Row 0 (z=0):  j1[0,0]   j2[5,0]   j3[10,0]  j4[15,0]   — Operations
// Row 1 (z=5):  j5[0,5]   j6[5,5]   j7[10,5]  j8[15,5]   — Habitation
// Row 2 (z=10): j9[0,10]  j10[5,10] j11[10,10] j12[15,10] — Agriculture
// Row 3 (z=15): j13[0,15] j14[5,15] j15[10,15]            — Industrial/access

export const marsJunctions: JunctionConfig[] = [
  // Row 0 — operations
  { id: 'j1',  position: [0, 0],   ports: ['north', 'east', 'south'] },
  { id: 'j2',  position: [5, 0],   ports: ['east', 'south', 'west'] },
  { id: 'j3',  position: [10, 0],  ports: ['east', 'south', 'west'] },
  { id: 'j4',  position: [15, 0],  ports: ['south', 'west'] },
  // Row 1 — outer habitation (j6/j7 absorbed into central dome)
  { id: 'j5',  position: [0, 5],   ports: ['north', 'east', 'south'] },
  { id: 'j8',  position: [15, 5],  ports: ['north', 'east', 'south', 'west'] },
  // Row 2 — outer agriculture (j10/j11 absorbed into central dome)
  { id: 'j9',  position: [0, 10],  ports: ['north', 'east', 'south'] },
  { id: 'j12', position: [15, 10], ports: ['north', 'west'] },
  // Row 3 — industrial/access
  { id: 'j13', position: [0, 15],  ports: ['north', 'south', 'west'] },
  { id: 'j14', position: [5, 15],  ports: ['north', 'east'] },
  { id: 'j15', position: [10, 15], ports: ['north', 'east', 'south', 'west'] },
];

export const marsModules: ModuleConfig[] = [
  // === Row 0 spanning (operations) ===
  {
    id: 'command', name: 'Mission Control Center', shortName: 'CMD',
    description: 'Central operations and mission coordination', size: 1.2,
    from: { junction: 'j1', port: 'east' },
    to: { junction: 'j2', port: 'west' },
  },
  {
    id: 'comms', name: 'Deep Space Communications', shortName: 'COM',
    description: 'Earth relay and deep space antenna array', size: 1.1,
    from: { junction: 'j2', port: 'east' },
    to: { junction: 'j3', port: 'west' },
  },
  {
    id: 'research', name: 'Areology Lab', shortName: 'LAB',
    description: 'Mars geology and atmospheric science research', size: 1.0,
    from: { junction: 'j3', port: 'east' },
    to: { junction: 'j4', port: 'west' },
  },

  // === Row 0→1 vertical spanning ===
  {
    id: 'lifesupport', name: 'Life Support', shortName: 'LSS',
    description: 'Atmospheric processing and environmental control', size: 1.0,
    from: { junction: 'j1', port: 'south' },
    to: { junction: 'j5', port: 'north' },
  },
  {
    id: 'moxie', name: 'MOXIE O2 Plant', shortName: 'MOX',
    description: 'Mars CO2-to-O2 extraction via solid oxide electrolysis', size: 1.0,
    from: { junction: 'j2', port: 'south' }, to: null,
  },
  {
    id: 'greenhouse', name: 'Greenhouse Alpha', shortName: 'GRN',
    description: 'Pressurized greenhouse using natural Martian light', size: 1.0,
    from: { junction: 'j3', port: 'south' }, to: null,
  },
  {
    id: 'storage', name: 'Storage Bay', shortName: 'STR',
    description: 'Primary cargo storage and supply depot', size: 0.9,
    from: { junction: 'j4', port: 'south' },
    to: { junction: 'j8', port: 'north' },
  },

  // === Row 1 spanning (habitation) ===
  {
    id: 'habitation', name: 'Habitation', shortName: 'HAB',
    description: 'Crew quarters and living spaces', size: 1.1,
    from: { junction: 'j5', port: 'east' }, to: null,
  },
  {
    id: 'medical', name: 'Medical Bay', shortName: 'MED',
    description: 'Comprehensive medical and surgical facilities', size: 1.1,
    from: { junction: 'j8', port: 'west' }, to: null,
  },

  // === Row 1→2 vertical spanning ===
  {
    id: 'bioprocessing', name: 'Bio-Processing', shortName: 'BIO',
    description: 'Biological waste processing and composting', size: 0.9,
    from: { junction: 'j5', port: 'south' },
    to: { junction: 'j9', port: 'north' },
  },
  {
    id: 'waterprocessing', name: 'Water Processing', shortName: 'H2O',
    description: 'Subsurface ice melting and water purification', size: 1.0,
    from: { junction: 'j8', port: 'south' },
    to: { junction: 'j12', port: 'north' },
  },

  // === Row 2 spanning (agriculture) ===
  {
    id: 'greenhouse2', name: 'Greenhouse Beta', shortName: 'GR2',
    description: 'Secondary agricultural dome — grains and legumes', size: 1.0,
    from: { junction: 'j9', port: 'east' }, to: null,
  },
  {
    id: 'greenhouse4', name: 'Greenhouse Delta', shortName: 'GR4',
    description: 'Quaternary agricultural dome — extended resupply buffer', size: 1.0,
    from: { junction: 'j12', port: 'west' }, to: null,
  },

  // === Row 2→3 vertical spanning ===
  {
    id: 'passage1', name: 'South Passage A', shortName: 'SP1',
    description: 'Transit corridor to southern industrial sector', size: 0.7,
    from: { junction: 'j9', port: 'south' },
    to: { junction: 'j13', port: 'north' },
  },
  {
    id: 'passage2', name: 'South Corridor', shortName: 'SP2',
    description: 'Connecting corridor between industrial sectors', size: 0.7,
    from: { junction: 'j14', port: 'east' },
    to: { junction: 'j15', port: 'west' },
  },

  // === Dead-end modules (7) ===
  {
    id: 'observatory', name: 'Weather Observatory', shortName: 'OBS',
    description: 'Meteorology station and atmospheric monitoring', size: 0.9,
    from: { junction: 'j1', port: 'north' }, to: null,
  },
  {
    id: 'power', name: 'Power Station', shortName: 'PWR',
    description: 'Nuclear, solar, and wind power control systems', size: 1.0,
    from: { junction: 'j8', port: 'east' }, to: null,
  },
  {
    id: 'airlock', name: 'Airlock/EVA Staging', shortName: 'ALK',
    description: 'Surface access and EVA suit staging', size: 0.8,
    from: { junction: 'j13', port: 'south' }, to: null,
  },
  {
    id: 'garagebay', name: 'Vehicle Garage', shortName: 'GAR',
    description: 'Pressurized garage for long-range Mars rovers', size: 1.1,
    from: { junction: 'j13', port: 'west' }, to: null,
  },
  {
    id: 'sabatier', name: 'Sabatier Processing', shortName: 'SAB',
    description: 'CH4/LOX propellant production via Sabatier reaction', size: 1.0,
    from: { junction: 'j14', port: 'east' }, to: null,
  },
  {
    id: 'docking', name: 'Surface Dock', shortName: 'DCK',
    description: 'Cargo receiving and surface lander interface', size: 0.9,
    from: { junction: 'j15', port: 'east' }, to: null,
  },
  {
    id: 'quarantine', name: 'Quarantine Lab', shortName: 'QRN',
    description: 'Planetary protection and biosafety containment', size: 0.9,
    from: { junction: 'j15', port: 'south' }, to: null,
  },
];
