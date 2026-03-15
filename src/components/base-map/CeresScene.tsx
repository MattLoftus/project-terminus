import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ceresJunctions, ceresModules } from '../../data/ceres-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';
import { NuclearReactor3D } from './NuclearReactor3D';
import { MassDriver3D } from './MassDriver3D';
import { MiningRig3D } from './MiningRig3D';
import { CeresGround, CeresRocks, CeresStarfield, CeresLight } from './CeresEnvironment';

// ---------------------------------------------------------------------------
// Floating dust near mining areas
// ---------------------------------------------------------------------------

function MiningDust() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 150;

  const offsets = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 10,
        Math.random() * 3,
        (Math.random() - 0.5) * 10,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [ox, oy, oz] = offsets[i];
      // Float around mining area
      dummy.position.set(
        14 + ox + Math.sin(t * 0.3 + i) * 0.5,
        oy + Math.sin(t * 0.5 + i * 0.7) * 0.3,
        2 + oz + Math.cos(t * 0.4 + i) * 0.5,
      );
      dummy.scale.setScalar(0.01 + Math.sin(t + i) * 0.005);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#a09080" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// CeresScene
// ---------------------------------------------------------------------------

export function CeresScene() {
  return (
    <>
      {/* No fog — no atmosphere */}

      {/* Very dark ambient — harsh shadows */}
      <ambientLight intensity={0.25} color="#808080" />
      <CeresLight />
      {/* Base area fill */}
      <pointLight position={[4, 4, 4]} intensity={0.6} color="#c0b090" distance={16} decay={2} />

      {/* Terrain */}
      <CeresGround />
      <CeresRocks />
      <CeresStarfield />
      <MiningDust />

      {/* Junctions */}
      {ceresJunctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallways */}
      {ceresModules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} junctions={ceresJunctions} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {ceresModules.map((m) => (
        <Module3D key={m.id} config={m} junctions={ceresJunctions} />
      ))}

      {/* Facilities */}
      <NuclearReactor3D position={[12, -0.2, 8]} />
      <MassDriver3D />
      <MiningRig3D position={[14, -0.2, 0]} rigId="rig-1" />
      <MiningRig3D position={[16, -0.2, 2]} rigId="rig-2" />
      <MiningRig3D position={[14, -0.2, 4]} rigId="rig-3" />
    </>
  );
}
