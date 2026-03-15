import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const darkMetal = new THREE.Color('#5a6270');
const hullColor = new THREE.Color('#c8d0d8');

const STATION_POS: [number, number, number] = [-3, -0.2, 0];

function Anemometer() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 2.5;
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* Rotating cups */}
      <group ref={ref}>
        {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle, i) => {
          const x = Math.cos(angle) * 0.12;
          const z = Math.sin(angle) * 0.12;
          return (
            <group key={i}>
              {/* Arm */}
              <mesh position={[x * 0.5, 0, z * 0.5]} rotation={[0, -angle, Math.PI / 2]}>
                <cylinderGeometry args={[0.005, 0.005, 0.14, 4]} />
                <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
              </mesh>
              {/* Cup */}
              <mesh position={[x, 0, z]}>
                <sphereGeometry args={[0.03, 6, 4, 0, Math.PI]} />
                <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function WindVane() {
  return (
    <group position={[0, 1.5, 0]}>
      {/* Vane */}
      <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.2, 4]} />
        <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SensorMast() {
  return (
    <group>
      {/* Main mast */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 2.0, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.04, 8]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Barometric sensor housing */}
      <mesh position={[0.08, 1.2, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Temperature sensor (aspirated shield) */}
      <mesh position={[-0.08, 1.0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Dust counter */}
      <mesh position={[0.06, 0.8, 0.06]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Small solar panel for power */}
      <mesh position={[0, 2.1, 0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.1]} />
        <meshStandardMaterial
          color="#3a7eb8"
          emissive={new THREE.Color('#3a7eb8')}
          emissiveIntensity={0.05}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

export function MarsWeatherStation3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);

  return (
    <group position={STATION_POS}>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0, 1, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([STATION_POS[0], 0, STATION_POS[2]]); setSelectedModule('facility-weather'); }}
        onPointerEnter={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[1, 2.5, 1]} />
      </mesh>

      <SensorMast />
      <Anemometer />
      <WindVane />

      <Label3D text="WTH" position={[0, 2.5, 0]} />
    </group>
  );
}
