import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Atmospheric processor — tall intake tower, filter banks, exhaust */
export function AtmoProcessor3D({ position = [12, -0.2, 0] as [number, number, number] }) {
  const exhaustRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Exhaust pulse
    if (exhaustRef.current) {
      const scale = 1 + Math.sin(t * 4) * 0.15;
      exhaustRef.current.scale.set(scale, 1, scale);
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(t * 2.5) * 0.15;
    }
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-atmoprocessor');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Main tower */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.6, 8]} />
        <meshStandardMaterial color="#605848" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Intake vanes at top */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(rad) * 0.22, 1.5, Math.sin(rad) * 0.22]} rotation={[0, rad, Math.PI / 6]}>
            <boxGeometry args={[0.12, 0.02, 0.06]} />
            <meshStandardMaterial color="#807060" roughness={0.6} metalness={0.5} />
          </mesh>
        );
      })}

      {/* Filter bank housing */}
      <mesh position={[0.35, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.4]} />
        <meshStandardMaterial color="#504838" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Exhaust vent */}
      <mesh ref={exhaustRef} position={[-0.3, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 6]} />
        <meshStandardMaterial color="#705840" roughness={0.7} metalness={0.3} transparent opacity={0.8} />
      </mesh>

      {/* Status light */}
      <mesh ref={glowRef} position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#c07820" emissive="#c07820" emissiveIntensity={0.3} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0.1, 0.02, 0]}>
        <boxGeometry args={[1, 0.04, 0.8]} />
        <meshStandardMaterial color="#3a3020" roughness={0.95} metalness={0.1} />
      </mesh>
    </group>
  );
}
