import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const padColor = new THREE.Color('#7a7a78');
const darkMetal = new THREE.Color('#5a6270');
const hullColor = new THREE.Color('#c8d0d8');
const beaconColor = new THREE.Color('#ff6020');
const seqLightColor = new THREE.Color('#00d4e0');

// Three pads south of the main road, each on its own branch
const PADS: { pos: [number, number, number]; label: string; hasLander: boolean }[] = [
  { pos: [-3, -0.2, 19], label: 'PAD-1', hasLander: true },
  { pos: [-8, -0.2, 19], label: 'PAD-2', hasLander: true },
  { pos: [-13, -0.2, 19], label: 'PAD-3', hasLander: false },
];

function LandingPlatform() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.0, 8]} />
        <meshStandardMaterial color={padColor} roughness={0.92} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[1.2, 1.3, 24]} />
        <meshStandardMaterial
          color="#c0c020"
          emissive={new THREE.Color('#c0c020')}
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, rot, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[0.06, 2.4]} />
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

function Lander() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.35, 0.5, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.25, 0.15, 0.2, 12]} />
        <meshStandardMaterial color={darkMetal} metalness={0.8} roughness={0.2} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const lx = Math.cos(angle) * 0.35;
        const lz = Math.sin(angle) * 0.35;
        const footX = Math.cos(angle) * 0.65;
        const footZ = Math.sin(angle) * 0.65;
        return (
          <group key={i}>
            <mesh position={[(lx + footX) / 2, 0.2, (lz + footZ) / 2]} rotation={[0, -angle, Math.PI / 6]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
              <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[footX, 0.03, footZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.06, 8]} />
              <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function FuelTanks() {
  return (
    <group position={[1.6, 0, 0.5]}>
      {[0, 0.5].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh position={[0, 0.35, 0]}>
            <capsuleGeometry args={[0.12, 0.35, 8, 12]} />
            <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.125, 0.015, 6, 12]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Beacons() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (t * 2 + i * 1.5) % 3;
      const intensity = phase < 0.3 ? 3.0 : 0.2;
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    });
  });

  const positions: [number, number, number][] = [
    [-1.8, 0.3, -1.8],
    [1.8, 0.3, -1.8],
    [-1.8, 0.3, 1.8],
    [1.8, 0.3, 1.8],
  ];

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0], pos[1] / 2, pos[2]]}>
            <cylinderGeometry args={[0.01, 0.01, pos[1], 4]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh ref={(el) => { refs.current[i] = el; }} position={pos}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color={beaconColor} emissive={beaconColor} emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SequencingLights() {
  const count = 12;
  const radius = 1.5;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = ((t * 1.5 + i * (1 / count) * 2) % 2);
      const intensity = phase < 0.3 ? 2.5 : 0.15;
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[x, 0.02, z]}>
            <sphereGeometry args={[0.02, 6, 4]} />
            <meshStandardMaterial color={seqLightColor} emissive={seqLightColor} emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </>
  );
}

const facilityStatusColors: Record<string, THREE.Color> = {
  nominal: new THREE.Color('#00d4e0'),
  warning: new THREE.Color('#f0a000'),
  critical: new THREE.Color('#ff3040'),
};

function SinglePad({ pos, label, hasLander, padIndex }: { pos: [number, number, number]; label: string; hasLander: boolean; padIndex: number }) {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const padStatus = useSimulation((s) => 'launchPads' in s.facilities ? s.facilities.launchPads[padIndex]?.status ?? 'nominal' : 'nominal' as const);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    const color = facilityStatusColors[padStatus] ?? facilityStatusColors.nominal;
    const speed = padStatus === 'critical' ? 4 : padStatus === 'warning' ? 2 : 0.8;
    const pulse = 0.2 + Math.sin(clock.elapsedTime * speed) * 0.1;
    mat.emissive.copy(color);
    mat.color.copy(color);
    mat.emissiveIntensity = pulse;
  });

  return (
    <group position={pos}>
      {/* Status glow */}
      <mesh ref={glowRef} position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 24]} />
        <meshStandardMaterial color={facilityStatusColors.nominal} emissive={facilityStatusColors.nominal} emissiveIntensity={0.3} transparent opacity={0.08} depthWrite={false} />
      </mesh>

      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([pos[0], 0, pos[2]]); setSelectedModule(`facility-${label.toLowerCase()}`); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[4, 2, 4]} />
      </mesh>

      <LandingPlatform />
      {hasLander && <Lander />}
      {hasLander && <SequencingLights />}
      <FuelTanks />
      <Beacons />

      <Label3D text={label} position={[0, 2, 0]} />

      {hovered && (
        <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Launch {label}</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">
              {hasLander ? 'Lander docked' : 'Pad empty — awaiting arrival'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function LaunchPad3D() {
  return (
    <group>
      {PADS.map((pad, i) => (
        <SinglePad key={i} pos={pad.pos} label={pad.label} hasLander={pad.hasLander} padIndex={i} />
      ))}
    </group>
  );
}
