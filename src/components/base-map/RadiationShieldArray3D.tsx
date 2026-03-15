import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Radiation shield array — large panels surrounding base, glow during high flux */
export function RadiationShieldArray3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const state = useSimulation.getState();
    const fac = state.facilities as Record<string, unknown>;
    const shield = fac.radiationShield as { fluxLevel?: number } | undefined;
    const flux = shield?.fluxLevel ?? 0;

    // Pulse shield panels during high radiation
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissiveIntensity = flux > 2 ? 0.3 + Math.sin(clock.elapsedTime * 4) * 0.2 : 0.05;
      }
    });
  });

  // Shield panels positioned around the base perimeter
  const panels: [number, number, number, number][] = [
    // [x, z, rotY, height]
    [-2, 2, 0, 2],
    [-2, 6, 0, 2],
    [10, 2, 0, 2],
    [10, 6, 0, 2],
    [2, -2, Math.PI / 2, 2],
    [6, -2, Math.PI / 2, 2],
    [2, 10, Math.PI / 2, 2],
    [6, 10, Math.PI / 2, 2],
  ];

  return (
    <group ref={groupRef}>
      {panels.map(([x, z, rotY, h], i) => (
        <mesh key={i} position={[x, h * 0.4 - 0.2, z]} rotation={[0, rotY, 0]}>
          <boxGeometry args={[0.06, h * 0.8, 1.5]} />
          <meshStandardMaterial
            color="#304050"
            roughness={0.4}
            metalness={0.6}
            emissive="#40a0e0"
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
