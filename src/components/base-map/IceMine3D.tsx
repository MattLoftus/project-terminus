import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const darkMetal = new THREE.Color('#5a6270');
const hullColor = new THREE.Color('#8a9098');

const MINE_POS: [number, number, number] = [20, -0.2, 12];

function DrillTower() {
  return (
    <group>
      {/* Tower frame — 4 legs + cross braces */}
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]}>
          <boxGeometry args={[0.04, 3.0, 0.04]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Cross braces */}
      {[0.5, 1.5, 2.5].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, -0.2]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.44, 0.025, 0.025]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, y, 0.2]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.44, 0.025, 0.025]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[-0.2, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.44, 0.025, 0.025]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Drill string */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Top pulley housing */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

function ExtractionChamber() {
  return (
    <group position={[1.0, 0, 0]}>
      {/* Main chamber — where ice is melted */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 1.0, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.02, 6, 16]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Pipe to drill area */}
      <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function SteamVents() {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  const seeds = useRef(Array.from({ length: count }, () => ({
    ox: (Math.random() - 0.5) * 0.8 + 1.0,
    oz: (Math.random() - 0.5) * 0.8,
    speed: 0.5 + Math.random() * 1.0,
    phase: Math.random() * Math.PI * 2,
  }))).current;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const life = ((t * s.speed + s.phase) % 3) / 3; // 0→1 lifecycle
      const y = 1.2 + life * 2.5;
      const spread = life * 0.5;
      dummy.position.set(
        s.ox + Math.sin(t + s.phase) * spread,
        y,
        s.oz + Math.cos(t + s.phase * 1.3) * spread,
      );
      const scale = (1 - life) * 0.8;
      dummy.scale.setScalar(Math.max(0.01, scale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.04, 4, 4]} />
      <meshBasicMaterial color="#c0c0c0" transparent opacity={0.12} />
    </instancedMesh>
  );
}

function WaterTanks() {
  return (
    <group position={[-1.0, 0, 0.8]}>
      {[0, 0.6].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <capsuleGeometry args={[0.15, 0.3, 8, 12]} />
            <meshStandardMaterial color="#6090b0" metalness={0.4} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function IceMine3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);

  return (
    <group position={MINE_POS}>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0.5, 1, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([MINE_POS[0], 0, MINE_POS[2]]); setSelectedModule('facility-icemine'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[4, 4, 3]} />
      </mesh>

      {/* Ground pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.005, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#6a6a5a" roughness={0.95} metalness={0.05} />
      </mesh>

      <DrillTower />
      <ExtractionChamber />
      <SteamVents />
      <WaterTanks />

      <Label3D text="ICE" position={[0.5, 3.6, 0]} />

      {hovered && (
        <Html position={[0.5, 4, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Ice Mining Operation</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">Subsurface ice extraction — drill depth 12.4m</div>
          </div>
        </Html>
      )}
    </group>
  );
}
