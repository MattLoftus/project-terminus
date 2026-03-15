import { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const frameColor = new THREE.Color('#5a6270');
const etchColor = new THREE.Color('#3e4855');
const solarBlue = new THREE.Color('#3a7eb8');

// Mars solar farm — larger arrays, east of base, weaker sunlight so more panels needed
const FARM_CENTER: [number, number, number] = [24, -0.2, 5];
const COLS = 8;
const ROWS = 5;
const COL_SPACING = 1.0;
const ROW_SPACING = 0.8;

function SolarPanel({ position }: { position: [number, number, number] }) {
  const panelY = position[1] + 0.18;
  return (
    <group position={position}>
      {([-0.13, 0.13] as const).map((zOff, i) => (
        <mesh key={i} position={[0, 0.09, zOff]}>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
          <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, panelY, 0]} rotation={[-0.44, 0, 0]}>
        <boxGeometry args={[0.7, 0.012, 0.45]} />
        <meshStandardMaterial
          color={solarBlue}
          emissive={solarBlue}
          emissiveIntensity={0.06}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0, panelY + 0.007, 0]} rotation={[-0.44, 0, 0]}>
        <boxGeometry args={[0.72, 0.003, 0.47]} />
        <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 0, 1].map((div) => (
        <mesh key={`h${div}`} position={[0, panelY + 0.008, div * 0.13]} rotation={[-0.44, 0, 0]}>
          <boxGeometry args={[0.68, 0.002, 0.003]} />
          <meshStandardMaterial color={etchColor} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function MarsSolarFarm3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);

  const panels: [number, number, number][] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      panels.push([
        FARM_CENTER[0] + (col - (COLS - 1) / 2) * COL_SPACING,
        0,
        FARM_CENTER[2] + (row - (ROWS - 1) / 2) * ROW_SPACING,
      ]);
    }
  }

  return (
    <group position={[0, -0.2, 0]}>
      <mesh
        visible={false}
        position={[FARM_CENTER[0], 0.5, FARM_CENTER[2]]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([FARM_CENTER[0], 0, FARM_CENTER[2]]); setSelectedModule('power'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[9, 1, 5]} />
      </mesh>

      {/* Ground pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FARM_CENTER[0], 0.005, FARM_CENTER[2]]}>
        <planeGeometry args={[
          (COLS - 1) * COL_SPACING + 1.2,
          (ROWS - 1) * ROW_SPACING + 1.0,
        ]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.95} metalness={0.05} />
      </mesh>

      {panels.map((pos, i) => (
        <SolarPanel key={i} position={pos} />
      ))}

      <Label3D text="SOL" position={[FARM_CENTER[0], 0.8, FARM_CENTER[2]]} />

      {hovered && (
        <Html position={[FARM_CENTER[0], 1.3, FARM_CENTER[2]]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Solar Farm</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">40 panels — reduced efficiency due to dust</div>
          </div>
        </Html>
      )}
    </group>
  );
}
