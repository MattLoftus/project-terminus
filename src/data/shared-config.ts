export type Direction = 'north' | 'south' | 'east' | 'west';

export interface JunctionConfig {
  id: string;
  position: [number, number]; // [x, z]
  ports: Direction[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  size: number;
  from: { junction: string; port: Direction };
  to: { junction: string; port: Direction } | null; // null = dead-end
}

export type SystemStatus = 'nominal' | 'warning' | 'critical';

// --- Layout constants ---

export const JUNCTION_RADIUS = 0.1;
export const HALLWAY_PAD = 0.7;
export const DEAD_END_LENGTH = 1.8;

// --- Helpers ---

export function getStatusColor(status: SystemStatus): string {
  switch (status) {
    case 'nominal': return '#00d4e0';
    case 'warning': return '#f0a000';
    case 'critical': return '#ff3040';
  }
}

export function directionVector(dir: Direction): [number, number] {
  switch (dir) {
    case 'north': return [0, -1];
    case 'south': return [0, 1];
    case 'east':  return [1, 0];
    case 'west':  return [-1, 0];
  }
}

export function getModulePlacement(mod: ModuleConfig, junctions: JunctionConfig[]) {
  const fromJunction = junctions.find((j) => j.id === mod.from.junction)!;
  const [fdx, fdz] = directionVector(mod.from.port);
  const fx = fromJunction.position[0];
  const fz = fromJunction.position[1];

  if (mod.to) {
    const toJunction = junctions.find((j) => j.id === mod.to!.junction)!;
    const tx = toJunction.position[0];
    const tz = toJunction.position[1];
    const cx = (fx + tx) / 2;
    const cz = (fz + tz) / 2;
    const dist = Math.sqrt((tx - fx) ** 2 + (tz - fz) ** 2);
    const length = dist - (JUNCTION_RADIUS + HALLWAY_PAD) * 2;
    const isHorizontal = Math.abs(tx - fx) > Math.abs(tz - fz);
    return { cx, cz, length, isHorizontal };
  } else {
    const hallway = HALLWAY_PAD * 0.5;
    const length = DEAD_END_LENGTH - JUNCTION_RADIUS - hallway;
    const cx = fx + fdx * (JUNCTION_RADIUS + hallway + length / 2);
    const cz = fz + fdz * (JUNCTION_RADIUS + hallway + length / 2);
    const isHorizontal = fdx !== 0;
    return { cx, cz, length, isHorizontal };
  }
}
