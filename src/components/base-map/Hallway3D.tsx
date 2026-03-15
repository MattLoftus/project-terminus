import * as THREE from 'three';
import type { ModuleConfig, JunctionConfig } from '../../data/base-config';
import {
  junctions as moonJunctions, JUNCTION_RADIUS, HALLWAY_PAD,
  directionVector,
} from '../../data/base-config';

const hullColor = new THREE.Color('#c8d0d8');
const etchColor = new THREE.Color('#3e4855');

const TUBE_RADIUS = 0.06;

interface Hallway3DProps {
  module: ModuleConfig;
  junctions?: JunctionConfig[];
}

/** Renders thin corridor tubes between a module's end caps and its junction(s) */
export function Hallway3D({ module: mod, junctions = moonJunctions }: Hallway3DProps) {
  const fromJunction = junctions.find((j) => j.id === mod.from.junction)!;
  const [fdx, fdz] = directionVector(mod.from.port);

  const tubes: { cx: number; cz: number; length: number; isHorizontal: boolean }[] = [];

  // "From" side hallway: from junction port to module end cap
  const fromJx = fromJunction.position[0];
  const fromJz = fromJunction.position[1];
  const hallwayLen = mod.to ? HALLWAY_PAD : HALLWAY_PAD * 0.5;

  // Tube starts at junction surface, ends at module end cap
  const fromTubeCx = fromJx + fdx * (JUNCTION_RADIUS + hallwayLen / 2);
  const fromTubeCz = fromJz + fdz * (JUNCTION_RADIUS + hallwayLen / 2);
  tubes.push({
    cx: fromTubeCx,
    cz: fromTubeCz,
    length: hallwayLen,
    isHorizontal: fdx !== 0,
  });

  // "To" side hallway (only for spanning modules)
  if (mod.to) {
    const toJunction = junctions.find((j) => j.id === mod.to!.junction)!;
    const [tdx, tdz] = directionVector(mod.to.port);
    const toJx = toJunction.position[0];
    const toJz = toJunction.position[1];

    const toTubeCx = toJx + tdx * (JUNCTION_RADIUS + hallwayLen / 2);
    const toTubeCz = toJz + tdz * (JUNCTION_RADIUS + hallwayLen / 2);
    tubes.push({
      cx: toTubeCx,
      cz: toTubeCz,
      length: hallwayLen,
      isHorizontal: tdx !== 0,
    });
  }

  return (
    <>
      {tubes.map((tube, i) => (
        <group key={i} position={[tube.cx, 0, tube.cz]}>
          <mesh rotation={[
            tube.isHorizontal ? 0 : Math.PI / 2,
            0,
            tube.isHorizontal ? Math.PI / 2 : 0,
          ]}>
            <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, tube.length, 10]} />
            <meshStandardMaterial
              color={hullColor}
              emissive={hullColor}
              emissiveIntensity={0.03}
              metalness={0.6}
              roughness={0.45}
            />
          </mesh>
          {/* Segment ring at midpoint */}
          <mesh rotation={[
            tube.isHorizontal ? 0 : Math.PI / 2,
            0,
            tube.isHorizontal ? Math.PI / 2 : 0,
          ]}>
            <torusGeometry args={[TUBE_RADIUS + 0.002, 0.004, 4, 10]} />
            <meshStandardMaterial color={etchColor} metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </>
  );
}
