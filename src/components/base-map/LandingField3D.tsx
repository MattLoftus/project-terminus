import { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const padColor = new THREE.Color('#7a7a6a');
const darkMetal = new THREE.Color('#5a6270');
const hullColor = new THREE.Color('#c8d0d8');
const beaconColor = new THREE.Color('#ff6020');

const FIELD_POS: [number, number, number] = [-6, -0.2, 22];

function LandingPad() {
  return (
    <group>
      {/* Large octagonal pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[3.5, 8]} />
        <meshStandardMaterial color={padColor} roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Landing circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[2.0, 2.1, 32]} />
        <meshStandardMaterial
          color="#c0c020"
          emissive={new THREE.Color('#c0c020')}
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Cross markers */}
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, rot, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[0.08, 4.0]} />
          <meshStandardMaterial
            color="#c0c020"
            emissive={new THREE.Color('#c0c020')}
            emissiveIntensity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function MarsLander({ offset }: { offset: [number, number, number] }) {
  return (
    <group position={offset}>
      {/* Body — wider, stockier lander for Mars */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.9, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Heat shield bottom */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.45, 0.15, 12]} />
        <meshStandardMaterial color="#6a5a4a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Upper aeroshell */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.5, 0.6, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 4 landing legs */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const lx = Math.cos(angle) * 0.5;
        const lz = Math.sin(angle) * 0.5;
        const footX = Math.cos(angle) * 0.85;
        const footZ = Math.sin(angle) * 0.85;
        return (
          <group key={i}>
            <mesh position={[(lx + footX) / 2, 0.2, (lz + footZ) / 2]} rotation={[0, -angle, Math.PI / 6]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
              <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[footX, 0.04, footZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.08, 8]} />
              <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BlastDeflectors() {
  // Low berms around the pad perimeter
  const count = 8;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * 4.0;
        const z = Math.sin(angle) * 4.0;
        return (
          <mesh key={i} position={[x, 0.12, z]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.3]} />
            <meshStandardMaterial color="#7a5a3a" roughness={0.95} metalness={0.02} />
          </mesh>
        );
      })}
    </group>
  );
}

function FieldBeacons() {
  const positions: [number, number, number][] = [
    [-3.5, 0.3, -3.5], [3.5, 0.3, -3.5],
    [-3.5, 0.3, 3.5], [3.5, 0.3, 3.5],
  ];

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0], pos[1] / 2, pos[2]]}>
            <cylinderGeometry args={[0.015, 0.015, pos[1], 4]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={pos}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color={beaconColor} emissive={beaconColor} emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function FuelFarm() {
  return (
    <group position={[5, 0, 0]}>
      {/* 3 methane/LOX tanks */}
      {[0, 0.8, 1.6].map((z, i) => (
        <group key={i} position={[0, 0, z - 0.8]}>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.18, 0.5, 8, 12]} />
            <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.185, 0.015, 6, 12]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      <Label3D text="FUEL" position={[0, 1.3, 0]} fontSize={0.08} />
    </group>
  );
}

export function LandingField3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);

  return (
    <group position={FIELD_POS}>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([FIELD_POS[0], 0, FIELD_POS[2]]); setSelectedModule('facility-landing'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[10, 2, 10]} />
      </mesh>

      <LandingPad />
      <MarsLander offset={[-0.5, 0, 0.5]} />
      <MarsLander offset={[1.2, 0, -0.8]} />
      <BlastDeflectors />
      <FieldBeacons />
      <FuelFarm />

      <Label3D text="LND" position={[0, 2.2, 0]} />

      {hovered && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Landing Field</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">Surface lander operations — 2 vehicles docked</div>
          </div>
        </Html>
      )}
    </group>
  );
}
