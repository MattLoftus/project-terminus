import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Ice drill station — tall derrick over ice bore hole */
export function IceDrillStation3D({ position = [14, -0.2, 4] as [number, number, number] }) {
  const drillRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (drillRef.current) {
      drillRef.current.rotation.y = t * 2;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.2;
    }
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-drill');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Derrick tower — 4 legs */}
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.7, z]}>
          <boxGeometry args={[0.03, 1.4, 0.03]} />
          <meshStandardMaterial color="#708090" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      {/* Cross braces */}
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#607080" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.9, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#607080" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Drill bit (rotating) */}
      <mesh ref={drillRef} position={[0, 0.05, 0]}>
        <coneGeometry args={[0.06, 0.2, 6]} />
        <meshStandardMaterial color="#a0b0c0" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Bore hole in ice */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.1, 16]} />
        <meshBasicMaterial color="#0a1520" />
      </mesh>

      {/* Top beacon */}
      <mesh ref={glowRef} position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#40a0e0" emissive="#40a0e0" emissiveIntensity={0.4} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color="#506070" roughness={0.8} metalness={0.3} />
      </mesh>
    </group>
  );
}
