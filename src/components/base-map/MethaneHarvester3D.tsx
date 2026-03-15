import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Methane harvester — pipeline from base to lake, collection tanks, animated pump */
export function MethaneHarvester3D({ position = [-4, -0.2, 8] as [number, number, number] }) {
  const pumpRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Pump piston animation
    if (pumpRef.current) {
      pumpRef.current.position.y = 0.4 + Math.sin(t * 2) * 0.06;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.15;
    }
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-harvester');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Main collection tank */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.6, 12]} />
        <meshStandardMaterial color="#5a4a35" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Secondary tank */}
      <mesh position={[0.9, 0.25, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.5, 10]} />
        <meshStandardMaterial color="#4a3a28" roughness={0.85} metalness={0.25} />
      </mesh>

      {/* Pump mechanism */}
      <mesh ref={pumpRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 6]} />
        <meshStandardMaterial color="#707060" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Pipeline to lake */}
      <mesh position={[-1.5, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
        <meshStandardMaterial color="#504030" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Status light */}
      <mesh ref={glowRef} position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#c07820" emissive="#c07820" emissiveIntensity={0.3} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0.3, 0.02, 0]}>
        <boxGeometry args={[2, 0.04, 1.2]} />
        <meshStandardMaterial color="#3a3020" roughness={0.95} metalness={0.1} />
      </mesh>
    </group>
  );
}
