import { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const frameColor = new THREE.Color('#5a6270');
const etchColor = new THREE.Color('#3e4855');
const solarBlue = new THREE.Color('#3a7eb8');
const conduitColor = new THREE.Color('#4a5260');

// Two solar fields east of the Power Station module — pushed east to clear modules
const FARM_FIELDS: { center: [number, number, number]; cols: number; rows: number }[] = [
  { center: [14.5, 0, 3.0], cols: 6, rows: 4 },
  { center: [14.5, 0, 7.0], cols: 6, rows: 4 },
];
const COL_SPACING = 1.0;
const ROW_SPACING = 0.8;

// Individual panel dimensions
const PANEL_W = 0.7;   // width (along X)
const PANEL_D = 0.45;  // depth (along Z)
const PANEL_THICKNESS = 0.012;
const PANEL_TILT = 0.44; // ~25° from horizontal, tilted toward "sun" (south-ish)
const LEG_HEIGHT = 0.18;
const LEG_RADIUS = 0.008;

/** A single solar panel on support legs */
function SolarPanel({ position }: { position: [number, number, number] }) {
  const [px, py, pz] = position;
  const panelY = py + LEG_HEIGHT;

  return (
    <group position={[px, py, pz]}>
      {/* Support legs — two per panel */}
      {([-PANEL_D * 0.3, PANEL_D * 0.3] as const).map((zOff, i) => (
        <mesh key={i} position={[0, LEG_HEIGHT / 2, zOff]}>
          <cylinderGeometry args={[LEG_RADIUS, LEG_RADIUS, LEG_HEIGHT, 6]} />
          <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Cross brace between legs */}
      <mesh position={[0, LEG_HEIGHT * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, PANEL_D * 0.5, 4]} />
        <meshStandardMaterial color={etchColor} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Panel — tilted */}
      <group position={[0, panelY, 0]} rotation={[-PANEL_TILT, 0, 0]}>
        {/* Solar surface */}
        <mesh>
          <boxGeometry args={[PANEL_W, PANEL_THICKNESS, PANEL_D]} />
          <meshStandardMaterial
            color={solarBlue}
            emissive={solarBlue}
            emissiveIntensity={0.08}
            metalness={0.3}
            roughness={0.15}
          />
        </mesh>
        {/* Panel frame border */}
        <mesh position={[0, PANEL_THICKNESS / 2 + 0.001, 0]}>
          <boxGeometry args={[PANEL_W + 0.02, 0.003, PANEL_D + 0.02]} />
          <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Grid lines on panel surface (cell divisions) */}
        {[-1, 0, 1].map((div) => (
          <mesh key={`h${div}`} position={[0, PANEL_THICKNESS / 2 + 0.002, div * PANEL_D * 0.3]}>
            <boxGeometry args={[PANEL_W - 0.02, 0.002, 0.003]} />
            <meshStandardMaterial color={etchColor} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        {[-1, 0, 1].map((div) => (
          <mesh key={`v${div}`} position={[div * PANEL_W * 0.3, PANEL_THICKNESS / 2 + 0.002, 0]}>
            <boxGeometry args={[0.003, 0.002, PANEL_D - 0.02]} />
            <meshStandardMaterial color={etchColor} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Power conduit running from the farm back to the Power Station */
function PowerConduit() {
  // From farm west edge to PWR module tip (~9.8, 0, 4.0)
  const farmWestX = FARM_FIELDS[0].center[0] - (FARM_FIELDS[0].cols - 1) * COL_SPACING / 2 - 0.6;
  const pwrTipX = 9.9;
  const conduitZ = 4.0; // j6 z-level
  const conduitLen = farmWestX - pwrTipX;
  const conduitCx = pwrTipX + conduitLen / 2;
  const conduitY = -0.14; // sits on ground

  return (
    <group>
      {/* Main conduit tray */}
      <mesh position={[conduitCx, conduitY, conduitZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[conduitLen, 0.025, 0.04]} />
        <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* Conduit support pylons */}
      {Array.from({ length: Math.floor(conduitLen / 0.6) }).map((_, i) => {
        const x = pwrTipX + 0.3 + i * 0.6;
        return (
          <mesh key={i} position={[x, -0.17, conduitZ]}>
            <boxGeometry args={[0.015, 0.06, 0.015]} />
            <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
      {/* Short Z-connector from conduit to farm fields */}
      <mesh position={[farmWestX, conduitY, (conduitZ + FARM_FIELDS[0].center[2]) / 2]}>
        <boxGeometry args={[0.04, 0.025, Math.abs(FARM_FIELDS[0].center[2] - conduitZ) + 1]} />
        <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
      </mesh>
    </group>
  );
}

function SolarField({ center, cols, rows }: { center: [number, number, number]; cols: number; rows: number }) {
  const panels: [number, number, number][] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = center[0] + (col - (cols - 1) / 2) * COL_SPACING;
      const z = center[2] + (row - (rows - 1) / 2) * ROW_SPACING;
      panels.push([x, 0, z]);
    }
  }

  return (
    <>
      {/* Ground pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], 0.005, center[2]]}>
        <planeGeometry args={[
          (cols - 1) * COL_SPACING + PANEL_W + 0.6,
          (rows - 1) * ROW_SPACING + PANEL_D + 0.6,
        ]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.95} metalness={0.05} />
      </mesh>
      {panels.map((pos, i) => (
        <SolarPanel key={i} position={pos} />
      ))}
    </>
  );
}

export function SolarFarm3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);
  const farmCenter = FARM_FIELDS[0].center;

  return (
    <group position={[0, -0.2, 0]}>
      {/* Click hit area over the whole farm */}
      <mesh
        visible={false}
        position={[farmCenter[0], 0.5, (FARM_FIELDS[0].center[2] + FARM_FIELDS[1].center[2]) / 2]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([farmCenter[0], 0, 5]); setSelectedModule('power'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[7, 1, 7]} />
      </mesh>

      {FARM_FIELDS.map((field, i) => (
        <SolarField key={i} center={field.center} cols={field.cols} rows={field.rows} />
      ))}

      <PowerConduit />

      <Label3D text="SOL" position={[farmCenter[0], 0.8, 5]} />

      {hovered && (
        <Html position={[farmCenter[0], 1.3, 5]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Solar Farm</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">Photovoltaic array — 48 panels</div>
          </div>
        </Html>
      )}
    </group>
  );
}
