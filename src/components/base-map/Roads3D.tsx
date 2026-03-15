import * as THREE from 'three';

const roadColor = new THREE.Color('#9a9a8a');
const markerColor = new THREE.Color('#6a6a5a');

interface RoadSegment {
  from: [number, number];
  to: [number, number];
}

// Road network
const ROUTES: RoadSegment[] = [
  // Main road west from airlock
  { from: [0, 14], to: [-13, 14] },
  // Branch south to PAD-1
  { from: [-3, 14], to: [-3, 19] },
  // Branch south to PAD-2
  { from: [-8, 14], to: [-8, 19] },
  // Branch south to PAD-3
  { from: [-13, 14], to: [-13, 19] },
  // Base to ISRU plant ([12, 12])
  { from: [4, 12], to: [8, 12] },
  { from: [8, 12], to: [12, 12] },
  // ISRU to Nuclear Reactor ([12, 22])
  { from: [12, 12], to: [12, 22] },
  // ISRU mining loop — east to mining site, return via south (avoiding solar farms)
  { from: [12, 12], to: [20, 12] },
  { from: [20, 12], to: [28, 12] },
  { from: [28, 12], to: [28, 5] },
  { from: [28, 5], to: [20, 5] },
  { from: [20, 5], to: [10, 5] },
  { from: [10, 5], to: [10, 12] },
  { from: [10, 12], to: [12, 12] },
];

const ROAD_WIDTH = 0.45;
const ROAD_Y = -0.195; // just above ground

function RoadStrip({ from, to }: RoadSegment) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;
  const angle = Math.atan2(dx, dz);

  const trackCount = Math.max(2, Math.floor(len / 0.8));

  return (
    <group position={[cx, ROAD_Y, cz]} rotation={[0, angle, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, len]} />
        <meshStandardMaterial
          color={roadColor}
          roughness={0.98}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: trackCount }).map((_, i) => {
        const z = -len / 2 + 0.2 + (i / (trackCount - 1)) * (len - 0.4);
        return (
          <mesh key={i} position={[0, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.03, 0.2]} />
            <meshStandardMaterial color={markerColor} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Roads3D() {
  return (
    <group>
      {ROUTES.map((seg, i) => (
        <RoadStrip key={i} from={seg.from} to={seg.to} />
      ))}
    </group>
  );
}
