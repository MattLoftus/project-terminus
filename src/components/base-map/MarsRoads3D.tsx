import { useMemo } from 'react';
import * as THREE from 'three';

interface RoadSegment {
  from: [number, number];
  to: [number, number];
}

// Mars base road network — routed around modules, not through them
// Base grid: rows at z=0,5,10,15; cols at x=0,5,10,15
// Vertical modules fill the gaps between rows, so roads go around the perimeter
const ROUTES: RoadSegment[] = [
  // Perimeter ring — north side (z=-2)
  { from: [-5, -2], to: [18, -2] },
  // Perimeter ring — east side
  { from: [18, -2], to: [18, 17] },
  // Perimeter ring — south side (z=17)
  { from: [-2, 17], to: [18, 17] },
  // Perimeter ring — west side
  { from: [-2, -2], to: [-2, 17] },
  // South road to landing field
  { from: [-2, 17], to: [-6, 17] },
  { from: [-6, 17], to: [-6, 22] },
  // East road to reactor
  { from: [18, 17], to: [18, 24] },
  // Road to ice mine
  { from: [18, 8], to: [20, 8] },
  { from: [20, 8], to: [20, 12] },
  // Road to sabatier plant
  { from: [10, 17], to: [10, 20] },
  // West road to wind turbines
  { from: [-2, 3], to: [-5, 3] },
  { from: [-5, 3], to: [-8, 5] },
  // Solar farm access
  { from: [18, 5], to: [24, 5] },
  // Weather station access
  { from: [-2, 0], to: [-3, 0] },
];

const ROAD_WIDTH = 0.45;
const ROAD_Y = -0.195;

export function MarsRoads3D() {
  // Merge all road strips and markers into single geometries
  const { roadGeo, markerGeo } = useMemo(() => {
    const roadPositions: number[] = [];
    const roadNormals: number[] = [];
    const roadIndices: number[] = [];
    const markerPositions: number[] = [];
    const markerNormals: number[] = [];
    const markerIndices: number[] = [];

    let roadVertOffset = 0;
    let markerVertOffset = 0;

    for (const { from, to } of ROUTES) {
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = -dz / len; // perpendicular
      const nz = dx / len;
      const hw = ROAD_WIDTH / 2;

      // Road quad (2 triangles)
      const corners = [
        [from[0] + nx * hw, ROAD_Y, from[1] + nz * hw],
        [from[0] - nx * hw, ROAD_Y, from[1] - nz * hw],
        [to[0] + nx * hw, ROAD_Y, to[1] + nz * hw],
        [to[0] - nx * hw, ROAD_Y, to[1] - nz * hw],
      ];
      for (const c of corners) {
        roadPositions.push(c[0], c[1], c[2]);
        roadNormals.push(0, 1, 0);
      }
      roadIndices.push(
        roadVertOffset, roadVertOffset + 1, roadVertOffset + 2,
        roadVertOffset + 1, roadVertOffset + 3, roadVertOffset + 2,
      );
      roadVertOffset += 4;

      // Center-line markers
      const trackCount = Math.max(2, Math.floor(len / 0.8));
      const markerHalfW = 0.015;
      const markerHalfL = 0.1;
      const dirX = dx / len;
      const dirZ = dz / len;
      for (let i = 0; i < trackCount; i++) {
        const t = 0.1 + (i / (trackCount - 1)) * 0.8;
        const cx = from[0] + dx * t;
        const cz = from[1] + dz * t;
        const my = ROAD_Y + 0.001;

        // Marker quad aligned along road direction
        const mc = [
          [cx + nx * markerHalfW + dirX * markerHalfL, my, cz + nz * markerHalfW + dirZ * markerHalfL],
          [cx - nx * markerHalfW + dirX * markerHalfL, my, cz - nz * markerHalfW + dirZ * markerHalfL],
          [cx + nx * markerHalfW - dirX * markerHalfL, my, cz + nz * markerHalfW - dirZ * markerHalfL],
          [cx - nx * markerHalfW - dirX * markerHalfL, my, cz - nz * markerHalfW - dirZ * markerHalfL],
        ];
        for (const c of mc) {
          markerPositions.push(c[0], c[1], c[2]);
          markerNormals.push(0, 1, 0);
        }
        markerIndices.push(
          markerVertOffset, markerVertOffset + 1, markerVertOffset + 2,
          markerVertOffset + 1, markerVertOffset + 3, markerVertOffset + 2,
        );
        markerVertOffset += 4;
      }
    }

    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    rg.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    rg.setIndex(roadIndices);

    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(markerPositions, 3));
    mg.setAttribute('normal', new THREE.Float32BufferAttribute(markerNormals, 3));
    mg.setIndex(markerIndices);

    return { roadGeo: rg, markerGeo: mg };
  }, []);

  return (
    <group>
      <mesh geometry={roadGeo}>
        <meshStandardMaterial color="#9a8a78" roughness={0.95} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={markerGeo}>
        <meshStandardMaterial color="#7a6a58" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
