import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const darkMetal = new THREE.Color('#5a6270');
const hullColor = new THREE.Color('#8a9098');
const pipeColor = new THREE.Color('#6a7080');

const PLANT_POS: [number, number, number] = [10, -0.2, 20];

function ReactorVessels() {
  return (
    <group>
      {/* Two main Sabatier reaction vessels */}
      {[[-0.5, 0, 0], [0.5, 0, 0]].map((off, i) => (
        <group key={i} position={[off[0], off[1], off[2]]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 1.2, 12]} />
            <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
          </mesh>
          {/* Base ring */}
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.36, 0.02, 6, 16]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Collar rings */}
          <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.015, 6, 16]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Cross pipe between vessels */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
        <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CO2IntakeStacks() {
  return (
    <group position={[0, 0, -1.2]}>
      {/* Two vertical intake stacks — pulling CO2 from Mars atmosphere */}
      {[-0.3, 0.3].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 2.0, 8]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Intake cap */}
          <mesh position={[0, 2.05, 0]}>
            <cylinderGeometry args={[0.15, 0.08, 0.1, 8]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Connecting pipe to reaction vessels */}
          <mesh position={[0, 0.15, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
            <meshStandardMaterial color={pipeColor} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CryoTanks() {
  return (
    <group position={[0, 0, 1.5]}>
      {/* 3 cryo storage tanks for methane and LOX output */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <capsuleGeometry args={[0.15, 0.4, 8, 12]} />
            <meshStandardMaterial
              color={i < 2 ? '#8090a0' : '#90a080'}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          {/* Band */}
          <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.155, 0.01, 6, 12]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HeatIndicator() {
  return (
    <mesh position={[0, 1.35, 0]}>
      <sphereGeometry args={[0.04, 8, 6]} />
      <meshStandardMaterial
        color="#ff6020"
        emissive={new THREE.Color('#ff4010')}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function ExhaustSteam() {
  const count = 20;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const life = ((t * 0.3 + offsets[i]) % 1);
      const stackX = i < count / 2 ? -0.3 : 0.3;
      dummy.position.set(
        stackX + (Math.sin(i * 7.1) * 0.05),
        2.1 + life * 1.2,
        -1.2 + (Math.cos(i * 3.7) * 0.05),
      );
      const s = 0.02 + life * 0.06;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshStandardMaterial color="#c0b0a0" transparent opacity={0.25} depthWrite={false} />
    </instancedMesh>
  );
}

export function SabatierPlant3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);

  return (
    <group position={PLANT_POS}>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([PLANT_POS[0], 0, PLANT_POS[2]]); setSelectedModule('facility-sabatier'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[4, 3, 5]} />
      </mesh>

      {/* Ground pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[3.5, 4.5]} />
        <meshStandardMaterial color="#6a6a5a" roughness={0.95} metalness={0.05} />
      </mesh>

      <ReactorVessels />
      <CO2IntakeStacks />
      <CryoTanks />
      <HeatIndicator />
      <ExhaustSteam />

      <Label3D text="SAB" position={[0, 2.5, 0]} />

      {hovered && (
        <Html position={[0, 3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Sabatier Plant</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">CH4/LOX propellant production</div>
          </div>
        </Html>
      )}
    </group>
  );
}
