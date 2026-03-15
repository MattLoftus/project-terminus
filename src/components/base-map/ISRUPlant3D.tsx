import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const hullColor = new THREE.Color('#8a9098');
const darkMetal = new THREE.Color('#5a6270');
const amberLight = new THREE.Color('#f0a000');
const conduitColor = new THREE.Color('#4a5260');
const regolithColor = new THREE.Color('#8a8078');
const tankGreen = new THREE.Color('#4a7a5a');

// Positioned east of the base
const ISRU_POS: [number, number, number] = [12, -0.2, 12];

// --- Processing Hoppers (larger, more detailed) ---

function ProcessingHopper({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      {/* Hopper cone */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.4, 0.18, 0.6, 10]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Upper rim */}
      <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.025, 6, 16]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Mid-section collar */}
      <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.015, 6, 12]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Discharge chute */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.25, 8]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Support frame — 4 legs with cross bracing */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const lx = Math.cos(angle) * 0.3;
        const lz = Math.sin(angle) * 0.3;
        return (
          <group key={i}>
            <mesh position={[lx, 0.25, lz]}>
              <cylinderGeometry args={[0.018, 0.018, 0.5, 4]} />
              <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Cross brace */}
            {i < 2 && (
              <mesh position={[lx * 0.5, 0.15, lz * 0.5]} rotation={[0, angle, Math.PI / 6]}>
                <cylinderGeometry args={[0.006, 0.006, 0.35, 4]} />
                <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} />
              </mesh>
            )}
          </group>
        );
      })}
      {/* Regolith inside (visible from top) */}
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshStandardMaterial color={regolithColor} roughness={0.95} metalness={0.02} />
      </mesh>
    </group>
  );
}

// --- Conveyor system ---

function ConveyorBelt({ from, to, height }: { from: [number, number]; to: [number, number]; height: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;
  const angle = Math.atan2(dx, dz);

  return (
    <group position={[cx, height, cz]} rotation={[0, angle, 0]}>
      {/* Rails */}
      {([-0.06, 0.06] as const).map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, len, 4]} />
          <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* Belt surface */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.1, 0.006, len * 0.95]} />
        <meshStandardMaterial color="#3a3530" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Roller supports */}
      {Array.from({ length: Math.max(2, Math.floor(len / 0.2)) }).map((_, i, arr) => {
        const z = -len / 2 + 0.1 + (i / (arr.length - 1)) * (len - 0.2);
        return (
          <mesh key={i} position={[0, -0.015, z]}>
            <boxGeometry args={[0.14, 0.012, 0.015]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

// --- Processing buildings ---

function ProcessingBuilding({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Main structure */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.55, 0.8]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Roof ridge */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 4]} scale={[0.7, 0.7, 1]}>
        <boxGeometry args={[0.35, 0.35, 0.82]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Access door */}
      <mesh position={[0.301, 0.15, 0]}>
        <planeGeometry args={[0.15, 0.25]} />
        <meshStandardMaterial color="#4a5260" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Equipment boxes on side */}
      <mesh position={[-0.35, 0.12, 0.2]}>
        <boxGeometry args={[0.08, 0.18, 0.15]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.45} />
      </mesh>
    </group>
  );
}

// --- Storage tanks ---

function StorageTank({ x, z, color }: { x: number; z: number; color: THREE.Color }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 8, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.05}
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>
      {/* Tank bands */}
      {[0.25, 0.4, 0.55].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.155, 0.01, 6, 12]} />
          <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

// --- Regolith dump zone ---

function RegolithDumpZone() {
  // Piles of regolith where trucks dump their loads
  return (
    <group position={[-1.5, 0, -0.8]}>
      {/* Ground marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshStandardMaterial color="#6a6258" roughness={0.98} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {/* Regolith piles — irregular mounds */}
      {[
        { x: -0.3, z: 0.1, r: 0.25, h: 0.15 },
        { x: 0.2, z: -0.15, r: 0.3, h: 0.2 },
        { x: -0.1, z: -0.3, r: 0.2, h: 0.12 },
        { x: 0.4, z: 0.2, r: 0.22, h: 0.14 },
      ].map((pile, i) => (
        <mesh key={i} position={[pile.x, pile.h * 0.4, pile.z]}>
          <coneGeometry args={[pile.r, pile.h, 8]} />
          <meshStandardMaterial color={regolithColor} roughness={0.95} metalness={0.02} />
        </mesh>
      ))}
      {/* Dump zone label post */}
      <mesh position={[0.7, 0.15, -0.5]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 4]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

// --- Exhaust stacks ---

function ExhaustStack({ x, z, height = 1.0 }: { x: number; z: number; height?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, height, 8]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, height + 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.05, 0.04, 8]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Steam/exhaust hint */}
      <mesh position={[0, height + 0.06, 0]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshBasicMaterial color="#aaaaaa" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// --- Animated excavator trucks on mining loop ---

// Loop waypoints in ISRU-local coordinates (ISRU is at [12, 12])
// These match the road network: east to mining site, north, west, south back
const TRUCK_LOOP: [number, number][] = [
  [0, 0],       // ISRU
  [16, 0],      // far east (mining site)
  [16, -7],     // north-east corner
  [-2, -7],     // north-west corner (x=10 world, west of solar farms)
  [-2, 0],      // back to ISRU longitude
  [0, 0],       // return to ISRU
];

function getTruckPosition(t: number): { x: number; z: number; angle: number } {
  // t is 0..1 through the loop
  const totalSegments = TRUCK_LOOP.length - 1;
  const segF = t * totalSegments;
  const segI = Math.floor(segF) % totalSegments;
  const segT = segF - Math.floor(segF);

  const from = TRUCK_LOOP[segI];
  const to = TRUCK_LOOP[(segI + 1) % TRUCK_LOOP.length];

  const x = from[0] + (to[0] - from[0]) * segT;
  const z = from[1] + (to[1] - from[1]) * segT;
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1]);

  return { x, z, angle };
}

function ExcavatorTruck({ offset }: { offset: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const truckColor = new THREE.Color('#b0a898');
  const cabColor = new THREE.Color('#5a6270');
  const bedColor = new THREE.Color('#6a6258');
  const wheelColor = new THREE.Color('#3a3a3a');
  const windshieldColor = new THREE.Color('#88b8cc');

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = 0.02; // slower for larger loop
    const t = ((clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    const { x, z, angle } = getTruckPosition(t);
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y = angle;
  });

  const wheelRadius = 0.07;
  const wheelWidth = 0.04;

  return (
    <group ref={groupRef}>
      {/* Main chassis frame */}
      <mesh position={[0, 0.14, 0.05]}>
        <boxGeometry args={[0.4, 0.1, 0.75]} />
        <meshStandardMaterial color={truckColor} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Cab */}
      <mesh position={[0, 0.32, -0.22]}>
        <boxGeometry args={[0.36, 0.22, 0.24]} />
        <meshStandardMaterial color={cabColor} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Windshield — front face */}
      <mesh position={[0, 0.35, -0.341]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshStandardMaterial color={windshieldColor} metalness={0.8} roughness={0.1} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Side windows */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`win${side}`} position={[side * 0.181, 0.35, -0.22]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.16, 0.12]} />
          <meshStandardMaterial color={windshieldColor} metalness={0.8} roughness={0.1} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Dump bed — tilted back slightly */}
      <group position={[0, 0.22, 0.18]} rotation={[-0.08, 0, 0]}>
        {/* Bed floor */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.38, 0.04, 0.42]} />
          <meshStandardMaterial color={bedColor} metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Bed sides */}
        {([-1, 1] as const).map((side) => (
          <mesh key={`bed${side}`} position={[side * 0.19, 0.08, 0]}>
            <boxGeometry args={[0.03, 0.14, 0.42]} />
            <meshStandardMaterial color={bedColor} metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        {/* Bed rear wall */}
        <mesh position={[0, 0.08, 0.21]}>
          <boxGeometry args={[0.38, 0.14, 0.03]} />
          <meshStandardMaterial color={bedColor} metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Bed front wall (shorter) */}
        <mesh position={[0, 0.06, -0.21]}>
          <boxGeometry args={[0.38, 0.1, 0.03]} />
          <meshStandardMaterial color={bedColor} metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Regolith load in bed */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.32, 0.06, 0.36]} />
          <meshStandardMaterial color={regolithColor} roughness={0.95} metalness={0.02} />
        </mesh>
      </group>

      {/* Wheels — 6 total: front pair + rear double pair */}
      {([-1, 1] as const).map((side) => (
        <group key={`wheels${side}`}>
          {/* Front wheel */}
          <mesh position={[side * 0.22, wheelRadius, -0.22]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 10]} />
            <meshStandardMaterial color={wheelColor} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Rear wheel 1 */}
          <mesh position={[side * 0.22, wheelRadius, 0.14]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 10]} />
            <meshStandardMaterial color={wheelColor} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Rear wheel 2 */}
          <mesh position={[side * 0.22, wheelRadius, 0.28]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 10]} />
            <meshStandardMaterial color={wheelColor} roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Amber roof light — bigger */}
      <mesh position={[0, 0.45, -0.22]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial
          color={amberLight}
          emissive={amberLight}
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Exhaust pipe on cab */}
      <mesh position={[0.16, 0.38, -0.14]}>
        <cylinderGeometry args={[0.015, 0.018, 0.2, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Exhaust cap */}
      <mesh position={[0.16, 0.49, -0.14]}>
        <cylinderGeometry args={[0.022, 0.015, 0.02, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// --- Work lights ---

function WorkLights() {
  return (
    <>
      {[
        [-0.8, 0.6, 0.6],
        [0.8, 0.6, -0.4],
        [-1.5, 0.5, -0.8],
        [0.3, 0.6, 0.8],
      ].map(([x, y, z], i) => (
        <group key={i}>
          {/* Light pole */}
          <mesh position={[x, y / 2, z]}>
            <cylinderGeometry args={[0.008, 0.01, y, 4]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[x, y, z]}>
            <sphereGeometry args={[0.02, 6, 4]} />
            <meshStandardMaterial color={amberLight} emissive={amberLight} emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// --- Pipe conduit to reactor ---

function PipeToReactor() {
  const conduitY = 0.06;
  return (
    <group>
      <mesh position={[0, conduitY, 2]}>
        <boxGeometry args={[0.04, 0.025, 4]} />
        <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
      </mesh>
      {[0.5, 1.5, 2.5, 3.5].map((z, i) => (
        <mesh key={i} position={[0, conduitY - 0.03, z]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// --- Pipe network between components ---

function InternalPipes() {
  const pipeR = 0.015;
  const segments: { from: [number, number, number]; to: [number, number, number] }[] = [
    // Hopper 1 to processing building
    { from: [-0.5, 0.3, -0.4], to: [0.3, 0.3, -0.4] },
    // Hopper 2 to processing building
    { from: [-0.5, 0.3, 0.5], to: [0.3, 0.3, 0.5] },
    // Processing to tanks
    { from: [0.6, 0.3, -0.4], to: [0.6, 0.3, 0.5] },
    { from: [0.6, 0.3, 0], to: [1.0, 0.3, 0] },
  ];

  return (
    <>
      {segments.map((seg, i) => {
        const dx = seg.to[0] - seg.from[0];
        const dy = seg.to[1] - seg.from[1];
        const dz = seg.to[2] - seg.from[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const cx = (seg.from[0] + seg.to[0]) / 2;
        const cy = (seg.from[1] + seg.to[1]) / 2;
        const cz = (seg.from[2] + seg.to[2]) / 2;

        return (
          <mesh key={i} position={[cx, cy, cz]}
            rotation={[
              Math.atan2(Math.sqrt(dx * dx + dz * dz), dy) - Math.PI / 2,
              Math.atan2(dx, dz),
              0
            ]}
          >
            <cylinderGeometry args={[pipeR, pipeR, len, 6]} />
            <meshStandardMaterial color={conduitColor} metalness={0.6} roughness={0.45} />
          </mesh>
        );
      })}
    </>
  );
}

// --- Mining site at far east end of loop ---

function MiningSite() {
  // Positioned at local coords ~[14-16, -2] (far east of the mining loop)
  return (
    <group position={[15, 0, -2]}>
      {/* Excavated pit — dark recessed ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[3.5, 2.5]} />
        <meshStandardMaterial color="#3a3530" roughness={0.98} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {/* Pit edges — slightly raised rim */}
      {[
        { x: -1.75, z: 0, sx: 0.08, sz: 2.5 },
        { x: 1.75, z: 0, sx: 0.08, sz: 2.5 },
        { x: 0, z: -1.25, sx: 3.5, sz: 0.08 },
        { x: 0, z: 1.25, sx: 3.5, sz: 0.08 },
      ].map((edge, i) => (
        <mesh key={i} position={[edge.x, 0.02, edge.z]}>
          <boxGeometry args={[edge.sx, 0.06, edge.sz]} />
          <meshStandardMaterial color={regolithColor} roughness={0.95} metalness={0.02} />
        </mesh>
      ))}

      {/* Loading ramp — angled platform for truck loading */}
      <group position={[-1.2, 0, 0.3]}>
        <mesh position={[0, 0.06, 0]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.8, 0.04, 1.2]} />
          <meshStandardMaterial color="#7a7a70" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Ramp side rails */}
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.38, 0.12, 0]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.04, 0.12, 1.2]} />
            <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Mechanical excavator/crane arm — static parked position */}
      <group position={[0.5, 0, -0.3]}>
        {/* Base turntable */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.2, 10]} />
          <meshStandardMaterial color="#6a6a60" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Boom arm — lower section */}
        <mesh position={[0.15, 0.55, 0]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color={amberLight} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Boom arm — upper section (angled forward) */}
        <mesh position={[0.45, 0.85, 0]} rotation={[0, 0, 0.8]}>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
          <meshStandardMaterial color={amberLight} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Bucket at end */}
        <mesh position={[0.75, 0.6, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.2, 0.1, 0.15]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Bucket teeth */}
        {[-0.06, 0, 0.06].map((oz, i) => (
          <mesh key={i} position={[0.85, 0.54, oz]}>
            <boxGeometry args={[0.03, 0.06, 0.02]} />
            <meshStandardMaterial color="#8a8a80" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Hydraulic cylinder */}
        <mesh position={[0.08, 0.35, 0.08]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.02, 0.025, 0.5, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Counterweight */}
        <mesh position={[-0.15, 0.2, 0]}>
          <boxGeometry args={[0.2, 0.12, 0.2]} />
          <meshStandardMaterial color="#5a5a55" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Regolith piles around the excavation */}
      {[
        { x: -1.6, z: -0.8, r: 0.35, h: 0.22 },
        { x: 1.5, z: 0.6, r: 0.3, h: 0.18 },
        { x: 0.8, z: -1.0, r: 0.25, h: 0.15 },
        { x: -0.5, z: 1.1, r: 0.4, h: 0.25 },
        { x: 1.2, z: -0.6, r: 0.2, h: 0.12 },
        { x: -1.0, z: 0.9, r: 0.28, h: 0.16 },
      ].map((pile, i) => (
        <mesh key={i} position={[pile.x, pile.h * 0.4, pile.z]}>
          <coneGeometry args={[pile.r, pile.h, 8]} />
          <meshStandardMaterial color={regolithColor} roughness={0.95} metalness={0.02} />
        </mesh>
      ))}

      {/* Work lights on tall poles */}
      {[
        { x: -1.8, z: -1.3 },
        { x: 1.8, z: -1.3 },
        { x: -1.8, z: 1.3 },
        { x: 1.8, z: 1.3 },
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={[pos.x, 0.5, pos.z]}>
            <cylinderGeometry args={[0.012, 0.015, 1.0, 4]} />
            <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[pos.x, 1.0, pos.z]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color={amberLight} emissive={amberLight} emissiveIntensity={2.0} />
          </mesh>
        </group>
      ))}

      {/* Safety barriers/bollards around pit perimeter */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const bx = Math.cos(angle) * 2.0;
        const bz = Math.sin(angle) * 1.5;
        return (
          <group key={i}>
            {/* Bollard post */}
            <mesh position={[bx, 0.12, bz]}>
              <cylinderGeometry args={[0.025, 0.03, 0.24, 6]} />
              <meshStandardMaterial color="#c44030" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Reflective top */}
            <mesh position={[bx, 0.25, bz]}>
              <sphereGeometry args={[0.02, 6, 4]} />
              <meshStandardMaterial color="#f0a000" emissive={amberLight} emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- Dust cloud effects at mining site ---

function DustClouds() {
  const dustRef = useRef<THREE.Group>(null);
  const dustColor = new THREE.Color('#a09080');

  // Dust particle definitions
  const particles = [
    { x: 14.5, z: -2.2, baseY: 0.15, size: 0.18, speed: 0.4, phase: 0 },
    { x: 15.3, z: -1.6, baseY: 0.1, size: 0.14, speed: 0.55, phase: 1.2 },
    { x: 15.8, z: -2.5, baseY: 0.2, size: 0.2, speed: 0.35, phase: 2.5 },
    { x: 14.2, z: -1.8, baseY: 0.12, size: 0.12, speed: 0.5, phase: 3.8 },
    { x: 15.0, z: -2.8, baseY: 0.08, size: 0.16, speed: 0.45, phase: 5.0 },
    { x: 15.6, z: -1.3, baseY: 0.18, size: 0.1, speed: 0.6, phase: 0.7 },
    { x: 14.8, z: -2.0, baseY: 0.25, size: 0.22, speed: 0.3, phase: 4.2 },
    { x: 15.4, z: -2.6, baseY: 0.14, size: 0.13, speed: 0.48, phase: 1.8 },
  ];

  useFrame(({ clock }) => {
    if (!dustRef.current) return;
    const t = clock.elapsedTime;
    dustRef.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const mesh = child as THREE.Mesh;
      // Slow vertical drift
      mesh.position.y = p.baseY + Math.sin(t * p.speed + p.phase) * 0.08;
      // Pulsing opacity
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.12 + Math.sin(t * p.speed * 0.8 + p.phase) * 0.06;
    });
  });

  return (
    <group ref={dustRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.baseY, p.z]}>
          <sphereGeometry args={[p.size, 8, 6]} />
          <meshStandardMaterial
            color={dustColor}
            transparent
            opacity={0.12}
            depthWrite={false}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Main ISRU component ---

const facilityStatusColors: Record<string, THREE.Color> = {
  nominal: new THREE.Color('#00d4e0'),
  warning: new THREE.Color('#f0a000'),
  critical: new THREE.Color('#ff3040'),
};

export function ISRUPlant3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const facilityStatus = useSimulation((s) => 'isru' in s.facilities ? s.facilities.isru.status : 'nominal' as const);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);

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
    <group position={ISRU_POS}>
      {/* Status glow */}
      <mesh ref={glowRef} position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 3.5]} />
        <meshStandardMaterial color={facilityStatusColors.nominal} emissive={facilityStatusColors.nominal} emissiveIntensity={0.3} transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Click hit area */}
      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([ISRU_POS[0], 0, ISRU_POS[2]]); setSelectedModule('facility-isru'); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[5, 2, 4]} />
      </mesh>

      {/* Ground pad — larger, industrial */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[4.5, 3.5]} />
        <meshStandardMaterial color="#6a6a68" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Processing hoppers — input side (west) */}
      <ProcessingHopper x={-0.5} z={-0.4} scale={1.0} />
      <ProcessingHopper x={-0.5} z={0.5} scale={0.85} />

      {/* Conveyor belts feeding from hoppers to processing */}
      <ConveyorBelt from={[-0.5, -0.4]} to={[0.3, -0.4]} height={0.35} />
      <ConveyorBelt from={[-0.5, 0.5]} to={[0.3, 0.5]} height={0.3} />

      {/* Processing building — center */}
      <ProcessingBuilding x={0.4} z={0} />

      {/* Output storage tanks — east side */}
      <StorageTank x={1.1} z={-0.4} color={tankGreen} />
      <StorageTank x={1.1} z={0.3} color={new THREE.Color('#5a7aaa')} />
      <StorageTank x={1.5} z={0} color={hullColor} />

      {/* Regolith dump zone — where trucks unload */}
      <RegolithDumpZone />

      {/* Exhaust stacks */}
      <ExhaustStack x={0.6} z={-0.7} height={1.2} />
      <ExhaustStack x={0.8} z={0.8} height={0.9} />

      {/* Internal pipe network */}
      <InternalPipes />

      <WorkLights />
      <PipeToReactor />

      {/* Mining site at far east end of loop */}
      <MiningSite />

      {/* Dust clouds at the mining site */}
      <DustClouds />

      {/* Excavator trucks on mining loop — 4 trucks evenly spaced */}
      <ExcavatorTruck offset={0} />
      <ExcavatorTruck offset={0.25} />
      <ExcavatorTruck offset={0.50} />
      <ExcavatorTruck offset={0.75} />

      <Label3D text="ISRU" position={[0, 1.8, 0]} />

      {hovered && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">ISRU Processing Plant</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">Regolith processing — O₂, H₂O, materials</div>
          </div>
        </Html>
      )}
    </group>
  );
}
