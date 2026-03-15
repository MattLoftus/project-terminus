import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const hullColor = new THREE.Color('#8a9098');
const darkMetal = new THREE.Color('#5a6270');
const warningRed = new THREE.Color('#ff3040');
const conduitColor = new THREE.Color('#4a5260');
const concreteColor = new THREE.Color('#6a6a6a');

// Default position for Moon base — far south-east, well away from habitation
const DEFAULT_POS: [number, number, number] = [12, -0.2, 22];

const reactorGlowColor = new THREE.Color('#40a0ff');

function ReactorVessel({ vesselRef }: { vesselRef: React.RefObject<THREE.Mesh | null> }) {
  return (
    <group>
      {/* Main containment vessel — taller cylinder */}
      <mesh ref={vesselRef} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 1.7, 16]} />
        <meshStandardMaterial
          color={hullColor}
          emissive={reactorGlowColor}
          emissiveIntensity={0.05}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={hullColor}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.035, 6, 24]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Mid equipment collar */}
      <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.57, 0.025, 6, 20]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Upper equipment collar */}
      <mesh position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.57, 0.025, 6, 20]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Control rod housings on top */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 0.28;
        const z = Math.sin(angle) * 0.28;
        return (
          <mesh key={i} position={[x, 1.9, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 6]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

function SecondaryCooling() {
  // Smaller cylinder next to main vessel, connected by pipes
  return (
    <group position={[1.0, 0, 0.3]}>
      {/* Secondary cooling vessel */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.0, 12]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.025, 6, 16]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Connecting pipes from main vessel to secondary */}
      <mesh position={[-0.45, 0.6, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-0.45, 0.35, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function TurbineHousing() {
  // Box-shaped turbine housing with exhaust vents
  return (
    <group position={[-1.1, 0, 0.2]}>
      {/* Main housing */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.9]} />
        <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Top cover plate */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.75, 0.04, 0.95]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Exhaust vents on top */}
      {[-0.2, 0, 0.2].map((z, i) => (
        <mesh key={i} position={[0, 0.76, z]}>
          <boxGeometry args={[0.4, 0.06, 0.12]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      {/* Connecting pipe to main vessel */}
      <mesh position={[0.55, 0.45, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function RadiatorFin({ angle }: { angle: number }) {
  const x = Math.cos(angle) * 1.3;
  const z = Math.sin(angle) * 1.3;
  return (
    <group position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
      {/* Taller radiator panel */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.04, 2.0, 0.9]} />
        <meshStandardMaterial
          color="#c04030"
          emissive={new THREE.Color('#ff4020')}
          emissiveIntensity={0.15}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Support struts */}
      <mesh position={[0, 0.1, -0.3]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0.3]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function HeatExchangerPipes() {
  // Pipes connecting the vessel to each radiator pair
  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const innerR = 0.6;
        const outerR = 1.1;
        const midR = (innerR + outerR) / 2;
        const x = Math.cos(angle) * midR;
        const z = Math.sin(angle) * midR;
        const len = outerR - innerR;
        return (
          <mesh
            key={i}
            position={[x, 0.3, z]}
            rotation={[0, -angle + Math.PI / 2, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.025, 0.025, len, 6]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function EquipmentBoxes() {
  // Small ground-level equipment boxes around the base
  const boxes = [
    { pos: [0.8, 0.1, -0.7] as [number, number, number], size: [0.25, 0.2, 0.2] as [number, number, number] },
    { pos: [-0.7, 0.1, -0.8] as [number, number, number], size: [0.2, 0.18, 0.25] as [number, number, number] },
    { pos: [-0.9, 0.08, 0.7] as [number, number, number], size: [0.3, 0.16, 0.2] as [number, number, number] },
    { pos: [0.6, 0.08, 0.9] as [number, number, number], size: [0.2, 0.16, 0.3] as [number, number, number] },
    { pos: [1.5, 0.1, -0.5] as [number, number, number], size: [0.22, 0.2, 0.22] as [number, number, number] },
  ];
  return (
    <group>
      {boxes.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function WarningLights({ vesselRef }: { vesselRef: React.RefObject<THREE.Mesh | null> }) {
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const blink = Math.sin(t * 3) > 0 ? 2.5 : 0.3;
    if (ref1.current) (ref1.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
    if (ref2.current) (ref2.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
    // Reactor vessel core glow pulse
    if (vesselRef.current) {
      const glow = 0.05 + Math.sin(t * 0.5) * 0.03;
      (vesselRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }
  });

  return (
    <>
      <mesh ref={ref1} position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={warningRed} emissive={warningRed} emissiveIntensity={2} />
      </mesh>
      <mesh ref={ref2} position={[0, 0.05, 0.65]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshStandardMaterial color={warningRed} emissive={warningRed} emissiveIntensity={2} />
      </mesh>
    </>
  );
}

function ExclusionZone() {
  // Dashed circle on the ground — larger radius
  const segments = 64;
  const radius = 3.0;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    if (i % 2 === 0) {
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0.01,
        Math.sin(angle) * radius,
      ));
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(nextAngle) * radius,
        0.01,
        Math.sin(nextAngle) * radius,
      ));
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={warningRed} transparent opacity={0.5} />
    </lineSegments>
  );
}

function WarningSignPosts() {
  // Warning posts at cardinal directions on exclusion perimeter
  const radius = 3.0;
  const cardinalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  return (
    <group>
      {cardinalAngles.map((angle, i) => {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Post */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
              <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Warning sign plate */}
            <mesh position={[0, 0.48, 0]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.15, 0.12, 0.01]} />
              <meshStandardMaterial
                color="#ffcc00"
                emissive={new THREE.Color('#ffaa00')}
                emissiveIntensity={0.1}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>
            {/* Radiation symbol dot on sign */}
            <mesh position={[0, 0.48, -0.006]} rotation={[0, -angle, 0]}>
              <circleGeometry args={[0.02, 6]} />
              <meshStandardMaterial color="#222" side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PowerConduitToBase() {
  // Conduit running from reactor at z=22 toward the base (west, then north)
  const conduitY = -0.14;
  return (
    <group>
      {/* West run from reactor toward x=8 */}
      <mesh position={[10, conduitY, 22]}>
        <boxGeometry args={[4, 0.025, 0.04]} />
        <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* North run from z=22 down to z=8 (toward base) */}
      <mesh position={[8, conduitY, 15]}>
        <boxGeometry args={[0.04, 0.025, 14]} />
        <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* Support pylons — horizontal run */}
      {[9, 10, 11].map((x) => (
        <mesh key={`h${x}`} position={[x, -0.17, 22]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* Support pylons — vertical run */}
      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((z) => (
        <mesh key={`v${z}`} position={[8, -0.17, z]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

const facilityStatusColors: Record<string, THREE.Color> = {
  nominal: new THREE.Color('#00d4e0'),
  warning: new THREE.Color('#f0a000'),
  critical: new THREE.Color('#ff3040'),
};

export function NuclearReactor3D({ position }: { position?: [number, number, number] } = {}) {
  const REACTOR_POS = position ?? DEFAULT_POS;
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const facilityStatus = useSimulation((s) => s.facilities.reactor.status);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);
  const vesselRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    const color = facilityStatusColors[facilityStatus] ?? facilityStatusColors.nominal;
    const speed = facilityStatus === 'critical' ? 4 : facilityStatus === 'warning' ? 2 : 0.8;
    const pulse = 0.2 + Math.sin(clock.elapsedTime * speed) * 0.1;
    mat.emissive.copy(color);
    mat.color.copy(color);
    mat.emissiveIntensity = pulse;
  });

  return (
    <group position={REACTOR_POS}>
      {/* Status glow */}
      <mesh ref={glowRef} position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color={facilityStatusColors.nominal} emissive={facilityStatusColors.nominal} emissiveIntensity={0.3} transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([REACTOR_POS[0], 0, REACTOR_POS[2]]); setSelectedModule('facility-reactor'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[4, 2.5, 4]} />
      </mesh>

      {/* Larger concrete ground pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial color={concreteColor} roughness={0.95} metalness={0.05} />
      </mesh>

      <ReactorVessel vesselRef={vesselRef} />
      <SecondaryCooling />
      <TurbineHousing />

      {/* 6 radiator fins at 60° intervals */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <RadiatorFin key={i} angle={(i / 6) * Math.PI * 2} />
      ))}

      <HeatExchangerPipes />
      <EquipmentBoxes />
      <WarningLights vesselRef={vesselRef} />
      <ExclusionZone />
      <WarningSignPosts />
      <PowerConduitToBase />

      {/* Label */}
      <Label3D text="NUK" position={[0, 2.5, 0]} />

      {hovered && (
        <Html position={[0, 3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">Nuclear Reactor</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">Fission power generation</div>
          </div>
        </Html>
      )}
    </group>
  );
}
