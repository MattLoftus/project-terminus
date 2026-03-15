import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Mass driver — long electromagnetic rail for launching ore payloads */
export function MassDriver3D({ position = [-4, -0.2, 4] as [number, number, number] }) {
  const chargeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!chargeRef.current) return;
    const t = clock.elapsedTime;
    (chargeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + Math.sin(t * 3) * 0.15;
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-massdriver');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Main rail (long) */}
      <mesh position={[0, 0.1, -2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 5]} />
        <meshStandardMaterial color="#606060" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Second rail */}
      <mesh position={[0.4, 0.1, -2]}>
        <boxGeometry args={[0.12, 0.08, 5]} />
        <meshStandardMaterial color="#606060" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Electromagnetic coils along rail */}
      {[-3.5, -2.5, -1.5, -0.5, 0.5].map((z, i) => (
        <mesh key={i} position={[0.2, 0.15, z]}>
          <torusGeometry args={[0.18, 0.02, 6, 12]} />
          <meshStandardMaterial color="#505060" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Charge indicator */}
      <mesh ref={chargeRef} position={[0.2, 0.25, 0.5]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#c0a030" emissive="#c0a030" emissiveIntensity={0.2} />
      </mesh>

      {/* Launch end ramp */}
      <mesh position={[0.2, 0.15, -4.5]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.5]} />
        <meshStandardMaterial color="#505050" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0.2, 0.02, -1.5]}>
        <boxGeometry args={[1, 0.04, 5.5]} />
        <meshStandardMaterial color="#2a2420" roughness={0.95} metalness={0.1} />
      </mesh>
    </group>
  );
}
