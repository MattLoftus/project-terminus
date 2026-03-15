import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Surface mining rig — drill derrick with rotating bit */
export function MiningRig3D({ position, rigId }: { position: [number, number, number]; rigId: string }) {
  const drillRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (drillRef.current) drillRef.current.rotation.y = t * 3;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(t * 2 + position[0]) * 0.15;
    }
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-mining');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Derrick frame */}
      {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5, z]}>
          <boxGeometry args={[0.025, 1, 0.025]} />
          <meshStandardMaterial color="#707060" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      {/* Drill bit */}
      <mesh ref={drillRef} position={[0, 0.05, 0]}>
        <coneGeometry args={[0.05, 0.15, 6]} />
        <meshStandardMaterial color="#909080" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Top pulley */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        <meshStandardMaterial color="#808070" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Status light */}
      <mesh ref={glowRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color="#c0a030" emissive="#c0a030" emissiveIntensity={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.5]} />
        <meshStandardMaterial color="#2a2420" roughness={0.95} metalness={0.1} />
      </mesh>
    </group>
  );
}
