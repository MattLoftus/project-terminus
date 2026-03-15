import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';

/** Cryo power plant — Stirling engine array exploiting Titan's temperature differential */
export function CryoPowerPlant3D({ position = [12, -0.2, 4] as [number, number, number] }) {
  const rotor1 = useRef<THREE.Mesh>(null);
  const rotor2 = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rotor1.current) rotor1.current.rotation.y = t * 1.5;
    if (rotor2.current) rotor2.current.rotation.y = -t * 1.2;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.2;
    }
  });

  const handleClick = () => {
    useSimulation.getState().setSelectedModule('facility-cryopower');
    useSimulation.getState().setFocusTarget(position);
  };

  return (
    <group position={position} onClick={handleClick}>
      {/* Engine housing 1 */}
      <group position={[-0.5, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.4]} />
          <meshStandardMaterial color="#606058" roughness={0.6} metalness={0.5} />
        </mesh>
        {/* Heat exchanger fins */}
        {[-0.15, 0, 0.15].map((z, i) => (
          <mesh key={i} position={[0, 0.22, z]}>
            <boxGeometry args={[0.45, 0.02, 0.04]} />
            <meshStandardMaterial color="#808070" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
        <mesh ref={rotor1} position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 6]} />
          <meshStandardMaterial color="#a09080" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Engine housing 2 */}
      <group position={[0.5, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.4]} />
          <meshStandardMaterial color="#606058" roughness={0.6} metalness={0.5} />
        </mesh>
        {[-0.15, 0, 0.15].map((z, i) => (
          <mesh key={i} position={[0, 0.22, z]}>
            <boxGeometry args={[0.45, 0.02, 0.04]} />
            <meshStandardMaterial color="#808070" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
        <mesh ref={rotor2} position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 6]} />
          <meshStandardMaterial color="#a09080" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Connecting pipe */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#504840" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Status beacon */}
      <mesh ref={glowRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color="#c07820" emissive="#c07820" emissiveIntensity={0.4} />
      </mesh>

      {/* Base pad */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.8]} />
        <meshStandardMaterial color="#3a3020" roughness={0.95} metalness={0.1} />
      </mesh>
    </group>
  );
}
