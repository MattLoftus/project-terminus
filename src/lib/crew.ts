import type { BaseType } from '../data/base-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrewRole = 'Commander' | 'Engineer' | 'Scientist' | 'Medical' | 'Pilot';
export type CrewStatus = 'active' | 'resting' | 'eva' | 'medical';

export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  role: CrewRole;
  status: CrewStatus;
  currentModule: string | null;
  morale: number;  // 0-100
  health: number;  // 0-100
}

// ---------------------------------------------------------------------------
// Name pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Sarah', 'James', 'Yuki', 'Amir', 'Elena', 'Kofi', 'Mei', 'Rajesh',
  'Ingrid', 'Diego', 'Fatima', 'Oleg', 'Priya', 'Marcus', 'Lena', 'Hassan',
  'Akiko', 'Pedro', 'Nadia', 'Chen', 'Sofia', 'Tomas', 'Amara', 'Viktor',
  'Anya', 'Felix', 'Zara', 'Erik', 'Leila', 'Sven', 'Mika', 'Ravi',
  'Astrid', 'Omar', 'Lucia', 'Kenji', 'Daria', 'Anton', 'Rosa', 'Ivan',
  'Hana', 'Gabriel', 'Noor', 'Dante', 'Elise', 'Kwame', 'Maren', 'Tariq',
];

const LAST_NAMES = [
  'Chen', 'Okafor', 'Petrov', 'Nakamura', 'Larsson', 'Gupta', 'Torres',
  'Adeyemi', 'Volkov', 'Tanaka', 'Reyes', 'Johansson', 'Singh', 'Kowalski',
  'Fernandez', 'Ibrahim', 'Park', 'Müller', 'Kimura', 'Santos', 'Lindqvist',
  'Patel', 'Bergström', 'Okoro', 'Sharma', 'Rivera', 'Andersen', 'Dubois',
  'Moreau', 'Sato', 'Ivanova', 'Barros', 'Ng', 'Hoffmann', 'Aziz',
  'Kovalenko', 'Hayashi', 'Costa', 'Jensen', 'Ali', 'Takahashi', 'Bauer',
  'Sundaram', 'Eriksson', 'Yamamoto', 'Rossi', 'Chandra', 'Virtanen',
];

const ROLES: CrewRole[] = ['Commander', 'Engineer', 'Scientist', 'Medical', 'Pilot'];

// Modules that crew are commonly assigned to (habitation-heavy)
const HABITABLE_MODULES = [
  'habitation', 'command', 'research', 'medical', 'greenhouse',
  'recreation', 'workshop', 'lifesupport', 'observatory', 'bioprocessing',
  'fabrication', 'logistics',
];

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

function seedHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export function generateCrew(baseType: BaseType, count: number, moduleIds: string[]): CrewMember[] {
  const rng = mulberry32(seedHash(baseType + '-crew'));
  const crew: CrewMember[] = [];

  // Pick habitable modules from this base's module list
  const habitable = moduleIds.filter(id =>
    HABITABLE_MODULES.some(h => id.startsWith(h)) || id.includes('hab')
  );
  // Fallback: use all modules if none match habitable pattern
  const assignableModules = habitable.length > 0 ? habitable : moduleIds.filter(id =>
    !id.startsWith('passage') && !id.startsWith('airlock') && !id.startsWith('docking')
  );

  for (let i = 0; i < count; i++) {
    const firstIdx = Math.floor(rng() * FIRST_NAMES.length);
    const lastIdx = Math.floor(rng() * LAST_NAMES.length);

    // Guarantee at least 1 Commander (index 0) and 1 Medical (index 1 if count > 1)
    let role: CrewRole;
    if (i === 0) role = 'Commander';
    else if (i === 1 && count > 1) role = 'Medical';
    else role = ROLES[Math.floor(rng() * ROLES.length)];

    // Distribute across habitable modules (habitation-heavy: 40% chance of habitation)
    let module: string | null = null;
    if (assignableModules.length > 0) {
      if (rng() < 0.4) {
        const habMods = assignableModules.filter(id => id.startsWith('hab'));
        module = habMods.length > 0
          ? habMods[Math.floor(rng() * habMods.length)]
          : assignableModules[Math.floor(rng() * assignableModules.length)];
      } else {
        module = assignableModules[Math.floor(rng() * assignableModules.length)];
      }
    }

    crew.push({
      id: `crew-${baseType}-${i}`,
      firstName: FIRST_NAMES[firstIdx],
      lastName: LAST_NAMES[lastIdx],
      role,
      status: rng() < 0.7 ? 'active' : 'resting',
      currentModule: module,
      morale: 65 + Math.floor(rng() * 20),  // 65-84
      health: 80 + Math.floor(rng() * 16),   // 80-95
    });
  }

  return crew;
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export function tickCrew(roster: CrewMember[]): { roster: CrewMember[]; evaActive: number; medicalAlerts: number } {
  let evaActive = 0;
  let medicalAlerts = 0;

  const updated = roster.map(member => {
    const m = { ...member };

    // Status rotation (~2% chance per tick)
    if (m.status === 'active' && Math.random() < 0.02) {
      m.status = 'resting';
    } else if (m.status === 'resting' && Math.random() < 0.02) {
      m.status = 'active';
    } else if (m.status === 'eva' && Math.random() < 0.05) {
      m.status = 'active';
    } else if (m.status === 'medical' && Math.random() < 0.01) {
      m.status = 'resting';
    }

    // Morale: slow random walk toward 75
    const moraleDelta = (75 - m.morale) * 0.01 + (Math.random() - 0.5) * 2;
    m.morale = Math.max(20, Math.min(100, m.morale + moraleDelta));

    // Health: slow random walk toward 90
    const healthDelta = (90 - m.health) * 0.005 + (Math.random() - 0.5) * 1;
    m.health = Math.max(10, Math.min(100, m.health + healthDelta));

    // Low health → medical status
    if (m.health < 50 && m.status !== 'medical' && Math.random() < 0.1) {
      m.status = 'medical';
    }

    if (m.status === 'eva') evaActive++;
    if (m.status === 'medical') medicalAlerts++;

    return m;
  });

  // Occasionally start EVA (if no one currently on EVA)
  if (evaActive === 0 && Math.random() < 0.008) {
    const activeMembers = updated.filter(m => m.status === 'active');
    if (activeMembers.length > 0) {
      const chosen = activeMembers[Math.floor(Math.random() * activeMembers.length)];
      const idx = updated.findIndex(m => m.id === chosen.id);
      updated[idx] = { ...updated[idx], status: 'eva' };
      evaActive = 1;
    }
  }

  return { roster: updated, evaActive, medicalAlerts };
}
