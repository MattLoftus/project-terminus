import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';
import { DEAD_END_LENGTH } from '../../data/shared-config';

const DOME_CENTER: [number, number, number] = [7.5, 0, 7.5];
const DOME_RADIUS = 5;
const DETAIL = 2; // Higher detail = smaller triangles (4× more faces than detail=1)
const INSET = 0.92; // Panel inset factor (gap between triangles)
const HEIGHT_SCALE = 0.6; // Squash dome height by 40%

const panelColor = new THREE.Color('#b08050');
const frameColor = new THREE.Color('#4a4a52');
const floorColor = new THREE.Color('#6a5a4a');
const hullColor = new THREE.Color('#c8d0d8');
const etchColor = new THREE.Color('#3e4855');

const TUBE_RADIUS = 0.08;

// Connection corridors from dome surface to each dead-end module
// Each entry: [junctionX, junctionZ, dirX, dirZ] — the outer junction and direction toward dome
const CONNECTIONS: [number, number, number, number][] = [
  [5, 0, 0, 1],      // moxie: j2 south
  [10, 0, 0, 1],     // greenhouse: j3 south
  [0, 5, 1, 0],      // habitation: j5 east
  [15, 5, -1, 0],    // medical: j8 west
  [0, 10, 1, 0],     // greenhouse2: j9 east
  [15, 10, -1, 0],   // greenhouse4: j12 west
];

/** Build geodesic hemisphere panels — each triangle inset toward its centroid for visible gaps */
function createDomePanels(radius: number, detail: number, inset: number, yScale: number) {
  const ico = new THREE.IcosahedronGeometry(radius, detail);
  const srcPos = ico.attributes.position;

  const panelPositions: number[] = [];
  const panelNormals: number[] = [];

  for (let i = 0; i < srcPos.count; i += 3) {
    const ay = srcPos.getY(i), by = srcPos.getY(i + 1), cy = srcPos.getY(i + 2);
    if (ay < -0.05 || by < -0.05 || cy < -0.05) continue;

    // Apply height squash
    const say = ay * yScale, sby = by * yScale, scy = cy * yScale;

    const cx = (srcPos.getX(i) + srcPos.getX(i + 1) + srcPos.getX(i + 2)) / 3;
    const ccy = (say + sby + scy) / 3;
    const cz = (srcPos.getZ(i) + srcPos.getZ(i + 1) + srcPos.getZ(i + 2)) / 3;

    const v0 = new THREE.Vector3(srcPos.getX(i), say, srcPos.getZ(i));
    const v1 = new THREE.Vector3(srcPos.getX(i + 1), sby, srcPos.getZ(i + 1));
    const v2 = new THREE.Vector3(srcPos.getX(i + 2), scy, srcPos.getZ(i + 2));
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    for (let v = 0; v < 3; v++) {
      const vx = srcPos.getX(i + v);
      const vy = [say, sby, scy][v];
      const vz = srcPos.getZ(i + v);
      panelPositions.push(
        cx + (vx - cx) * inset,
        ccy + (vy - ccy) * inset,
        cz + (vz - cz) * inset,
      );
      panelNormals.push(normal.x, normal.y, normal.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(panelPositions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(panelNormals, 3));
  return geo;
}

/** Build the structural frame (edges of all hemisphere triangles) */
function createDomeFrame(radius: number, detail: number, yScale: number) {
  const ico = new THREE.IcosahedronGeometry(radius, detail);
  const srcPos = ico.attributes.position;

  const keepPositions: number[] = [];
  for (let i = 0; i < srcPos.count; i += 3) {
    const ay = srcPos.getY(i), by = srcPos.getY(i + 1), cy = srcPos.getY(i + 2);
    if (ay < -0.05 || by < -0.05 || cy < -0.05) continue;
    for (let v = 0; v < 3; v++) {
      keepPositions.push(srcPos.getX(i + v), srcPos.getY(i + v) * yScale, srcPos.getZ(i + v));
    }
  }

  const dome = new THREE.BufferGeometry();
  dome.setAttribute('position', new THREE.Float32BufferAttribute(keepPositions, 3));
  return new THREE.EdgesGeometry(dome, 1);
}

/** Compute connection corridor geometry data */
function computeCorridors() {
  const cx = DOME_CENTER[0];
  const cz = DOME_CENTER[2];

  return CONNECTIONS.map(([jx, jz, dx, dz]) => {
    // Module dead-end tip position (junction + direction * DEAD_END_LENGTH)
    const tipX = jx + dx * DEAD_END_LENGTH;
    const tipZ = jz + dz * DEAD_END_LENGTH;

    // Dome surface intersection along the line from tip toward dome center
    // Line: P = tip + t * dir_to_center
    // Circle: |P - center|² = R²
    const toX = cx - tipX;
    const toZ = cz - tipZ;
    const dist = Math.sqrt(toX * toX + toZ * toZ);
    const ndx = toX / dist;
    const ndz = toZ / dist;

    // Quadratic: t² + 2bt + c = 0 where b = dot(tip-center, dir), c = |tip-center|² - R²
    const ox = tipX - cx;
    const oz = tipZ - cz;
    const b = ox * ndx + oz * ndz;
    const c = ox * ox + oz * oz - DOME_RADIUS * DOME_RADIUS;
    const disc = b * b - c;
    const t = -b - Math.sqrt(Math.max(0, disc));

    const surfX = tipX + ndx * t;
    const surfZ = tipZ + ndz * t;

    // Corridor from module tip to dome surface
    const corridorCx = (tipX + surfX) / 2;
    const corridorCz = (tipZ + surfZ) / 2;
    const corridorLen = Math.sqrt((surfX - tipX) ** 2 + (surfZ - tipZ) ** 2);
    const isHorizontal = Math.abs(dx) > 0;

    return { corridorCx, corridorCz, corridorLen, isHorizontal, surfX, surfZ };
  });
}

export function CentralDome3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const [hovered, setHovered] = useState(false);

  const { panelGeo, frameGeo, corridors } = useMemo(() => ({
    panelGeo: createDomePanels(DOME_RADIUS, DETAIL, INSET, HEIGHT_SCALE),
    frameGeo: createDomeFrame(DOME_RADIUS, DETAIL, HEIGHT_SCALE),
    corridors: computeCorridors(),
  }), []);

  return (
    <group>
      {/* Dome structure — positioned at center */}
      <group position={DOME_CENTER}>
        {/* Clickable invisible sphere */}
        <mesh
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            setFocusTarget([DOME_CENTER[0], 0, DOME_CENTER[2]]);
            setSelectedModule('dome');
          }}
          onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[DOME_RADIUS * HEIGHT_SCALE + 0.5, 16, 16]} />
        </mesh>

        {/* Triangular panels */}
        <mesh geometry={panelGeo}>
          <meshStandardMaterial
            color={panelColor}
            transparent
            opacity={0.35}
            roughness={0.3}
            metalness={0.2}
            side={THREE.DoubleSide}
            emissive={panelColor}
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* Structural frame */}
        <lineSegments geometry={frameGeo}>
          <lineBasicMaterial color={frameColor} linewidth={1} />
        </lineSegments>

        {/* Floor / foundation pad */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[DOME_RADIUS + 0.3, 32]} />
          <meshStandardMaterial color={floorColor} roughness={0.95} metalness={0.05} />
        </mesh>

        {/* Inner ring floor detail */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[DOME_RADIUS * 0.6, DOME_RADIUS * 0.65, 32]} />
          <meshStandardMaterial color={frameColor} roughness={0.8} metalness={0.3} />
        </mesh>

        {/* Central platform */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 0.15, 16]} />
          <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Interior structural columns (4 at compass points) */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
          const r = DOME_RADIUS * 0.55;
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const height = Math.sqrt(Math.max(0, DOME_RADIUS * DOME_RADIUS - r * r)) * 0.85 * HEIGHT_SCALE;
          return (
            <group key={i}>
              {/* Column */}
              <mesh position={[x, height / 2, z]}>
                <cylinderGeometry args={[0.06, 0.08, height, 8]} />
                <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.5} />
              </mesh>
              {/* Workstation cluster at column base */}
              <mesh position={[x, 0.06, z]}>
                <boxGeometry args={[0.4, 0.12, 0.25]} />
                <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.4} />
              </mesh>
              {/* Console screen */}
              <mesh position={[x, 0.15, z + (Math.sin(angle) > 0 ? -0.13 : 0.13)]}>
                <boxGeometry args={[0.25, 0.08, 0.01]} />
                <meshStandardMaterial color="#1a3040" emissive={new THREE.Color('#00d4e0')} emissiveIntensity={0.3} />
              </mesh>
            </group>
          );
        })}

        {/* Central ops table on platform */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.04, 16]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Holographic display above table */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.01, 16]} />
          <meshStandardMaterial color="#1a3040" emissive={new THREE.Color('#00d4e0')} emissiveIntensity={0.2} transparent opacity={0.4} />
        </mesh>

        {/* Interior lighting ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DOME_RADIUS * HEIGHT_SCALE * 0.6, 0]}>
          <torusGeometry args={[DOME_RADIUS * 0.4, 0.03, 6, 24]} />
          <meshStandardMaterial color="#e0a060" emissive={new THREE.Color('#e0a060')} emissiveIntensity={0.5} />
        </mesh>

        {/* Floor pathway markings — cross pattern */}
        {[0, Math.PI / 2].map((rot, i) => (
          <mesh key={`path-${i}`} rotation={[-Math.PI / 2, rot, 0]} position={[0, 0.015, 0]}>
            <planeGeometry args={[0.15, DOME_RADIUS * 1.6]} />
            <meshStandardMaterial color="#7a6a5a" roughness={0.9} metalness={0.1} />
          </mesh>
        ))}

        <Label3D text="DOME" position={[0, DOME_RADIUS * HEIGHT_SCALE + 0.8, 0]} fontSize={0.18} />

        {hovered && (
          <Html position={[0, DOME_RADIUS * HEIGHT_SCALE + 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
              <div className="font-mono text-xs text-cyan font-medium">Central Habitat Dome</div>
              <div className="font-mono text-[10px] text-text-secondary mt-1">Primary habitat — command, recreation, fabrication</div>
            </div>
          </Html>
        )}
      </group>

      {/* Connection corridors — tubes from dome surface to dead-end module tips */}
      {corridors.map((c, i) => (
        <group key={i} position={[c.corridorCx, 0, c.corridorCz]}>
          {/* Main corridor tube */}
          <mesh rotation={[
            c.isHorizontal ? 0 : Math.PI / 2,
            0,
            c.isHorizontal ? Math.PI / 2 : 0,
          ]}>
            <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, c.corridorLen, 10]} />
            <meshStandardMaterial
              color={hullColor}
              emissive={hullColor}
              emissiveIntensity={0.03}
              metalness={0.6}
              roughness={0.45}
            />
          </mesh>
          {/* Collar rings at each end */}
          {[-1, 1].map((end) => {
            const offset = (c.corridorLen / 2) * end;
            const isDomeSide = end === 1; // dome-side end gets docking ring
            return (
              <group key={end} position={[
                c.isHorizontal ? offset : 0,
                0,
                c.isHorizontal ? 0 : offset,
              ]}>
                {/* Collar torus */}
                <mesh rotation={[
                  c.isHorizontal ? 0 : Math.PI / 2,
                  0,
                  c.isHorizontal ? Math.PI / 2 : 0,
                ]}>
                  <torusGeometry args={[TUBE_RADIUS + (isDomeSide ? 0.015 : 0.005), isDomeSide ? 0.012 : 0.008, 6, 12]} />
                  <meshStandardMaterial color={isDomeSide ? frameColor : etchColor} metalness={0.7} roughness={0.35} />
                </mesh>
                {/* Status beacons on dome-side docking ring */}
                {isDomeSide && [-1, 1].map((side) => (
                  <mesh key={side} position={[0, TUBE_RADIUS * side * 1.2, 0]}>
                    <sphereGeometry args={[0.015, 6, 4]} />
                    <meshStandardMaterial color="#00ff40" emissive={new THREE.Color('#00ff40')} emissiveIntensity={1.5} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
