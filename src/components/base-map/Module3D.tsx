import { useRef, useState, useMemo, useEffect, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Label3D } from './Label3D';
import type { ModuleConfig, JunctionConfig } from '../../data/base-config';
import { getModulePlacement as moonGetModulePlacement } from '../../data/base-config';
import { getModulePlacement as genericGetModulePlacement } from '../../data/shared-config';
import { useSimulation } from '../../store/simulation';

// ---------------------------------------------------------------------------
// Module animation registry — single useFrame for all modules
// ---------------------------------------------------------------------------

interface ModuleAnimEntry {
  groupRef: React.RefObject<THREE.Group | null>;
  glowRef: React.RefObject<THREE.Mesh | null>;
  beacon1Ref: React.RefObject<THREE.Mesh | null>;
  beacon2Ref: React.RefObject<THREE.Mesh | null>;
  getStatus: () => 'nominal' | 'warning' | 'critical';
  getHovered: () => boolean;
}

const moduleAnimRegistry = new Map<string, ModuleAnimEntry>();

/** Render once per scene to drive all module animations with a single useFrame */
export function ModuleAnimationManager() {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    moduleAnimRegistry.forEach((entry) => {
      const status = entry.getStatus();
      const hovered = entry.getHovered();

      // Glow pulse
      if (entry.glowRef.current) {
        const mat = entry.glowRef.current.material as THREE.MeshStandardMaterial;
        const speed = status === 'critical' ? 4 : status === 'warning' ? 2 : 0.8;
        const pulse = 0.2 + Math.sin(t * speed) * 0.1;
        mat.emissiveIntensity = hovered ? 0.6 : pulse;
        mat.opacity = hovered ? 0.15 : 0.08;
      }

      // Hover lift
      if (entry.groupRef.current) {
        const targetY = hovered ? 0.06 : 0;
        entry.groupRef.current.position.y += (targetY - entry.groupRef.current.position.y) * 0.1;
      }

      // Status beacons
      const blink = Math.sin(t * (status === 'critical' ? 6 : status === 'warning' ? 3 : 1.2));
      const beaconIntensity = status === 'nominal' ? (blink > 0.8 ? 1.5 : 0.2) : (blink > 0 ? 2.0 : 0.1);
      if (entry.beacon1Ref.current) (entry.beacon1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = beaconIntensity;
      if (entry.beacon2Ref.current) (entry.beacon2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = beaconIntensity;
    });
  });

  return null;
}

interface Module3DProps {
  config: ModuleConfig;
  junctions?: JunctionConfig[];
}

const statusColors = {
  nominal: new THREE.Color('#00d4e0'),
  warning: new THREE.Color('#f0a000'),
  critical: new THREE.Color('#ff3040'),
};

// Station material palette — matching project-tycho style
const metalColor = new THREE.Color('#c8d0d8');
const darkMetalColor = new THREE.Color('#5a6270');
const etchColor = new THREE.Color('#3e4855');
const windowGlow = new THREE.Color('#fff4c2');
const solarBlue = new THREE.Color('#3a7eb8');

// --- Shared material helpers ---

function HullMaterial({ hovered }: { hovered: boolean }) {
  return (
    <meshStandardMaterial
      color={metalColor}
      emissive={metalColor}
      emissiveIntensity={hovered ? 0.12 : 0.05}
      metalness={0.5}
      roughness={0.4}
    />
  );
}

function DarkMaterial({ hovered }: { hovered: boolean }) {
  return (
    <meshStandardMaterial
      color={darkMetalColor}
      emissive={darkMetalColor}
      emissiveIntensity={hovered ? 0.06 : 0.01}
      metalness={0.7}
      roughness={0.35}
    />
  );
}

function EtchMaterial() {
  return <meshStandardMaterial color={etchColor} metalness={0.7} roughness={0.4} />;
}

// --- Shared geometry pieces ---

/** Collar ring around a cylinder at position z along its axis */
function CollarRing({ radius, z }: { radius: number; z: number }) {
  return (
    <mesh position={[0, 0, z]}>
      <torusGeometry args={[radius, 0.02, 6, 16]} />
      <EtchMaterial />
    </mesh>
  );
}

/** Portholes along the top of a horizontal cylinder */
function Portholes({ radius, count, length }: { radius: number; count: number; length: number }) {
  const halfLen = length / 2;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const z = -halfLen + 0.12 + (i / Math.max(count - 1, 1)) * (length - 0.24);
        return (
          <mesh key={i} position={[0, radius + 0.005, z]}>
            <planeGeometry args={[0.04, 0.04]} />
            <meshStandardMaterial
              color={windowGlow}
              emissive={windowGlow}
              emissiveIntensity={1.2}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

/** Panel seam lines running lengthwise */
function PanelSeams({ radius, length, count }: { radius: number; length: number; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * (radius + 0.003);
        const y = Math.sin(angle) * (radius + 0.003);
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, -angle]}>
            <planeGeometry args={[0.005, length - 0.06]} />
            <meshStandardMaterial color={etchColor} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </>
  );
}

// --- Base cylindrical module ---
// Renders a horizontal cylinder along the local Z axis, centered at origin.

function CylindricalModule({ radius, length, hovered, portCount = 6, seamCount = 6 }: {
  radius: number; length: number; hovered: boolean; portCount?: number; seamCount?: number;
}) {
  const halfLen = length / 2;
  return (
    <>
      {/* Main cylinder — along Z, open-ended (caps rendered separately) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 24, 1, true]} />
        <HullMaterial hovered={hovered} />
      </mesh>
      {/* Flat end caps — simple filled circles */}
      {([-1, 1] as const).map((end) => (
        <mesh key={end} position={[0, 0, end * halfLen]} rotation={end === -1 ? [0, Math.PI, 0] : [0, 0, 0]}>
          <circleGeometry args={[radius, 24]} />
          <DarkMaterial hovered={hovered} />
        </mesh>
      ))}
      {/* Collar rings at ends and middle */}
      <CollarRing radius={radius + 0.01} z={0} />
      <CollarRing radius={radius + 0.01} z={-halfLen + 0.04} />
      <CollarRing radius={radius + 0.01} z={halfLen - 0.04} />
      {/* Portholes */}
      <Portholes radius={radius} count={portCount} length={length} />
      {/* Panel seams */}
      <PanelSeams radius={radius} length={length} count={seamCount} />
    </>
  );
}

// --- Per-module unique geometry ---
// Each renders centered at origin along Z. `len` is the actual module length from layout.

interface GeoProps { len: number; statusColor: THREE.Color; hovered: boolean }

function CommandGeometry({ len, hovered }: GeoProps) {
  const r = 0.40;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={8} seamCount={8} />
      {/* Upper equipment ridge */}
      <mesh position={[0, r + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.45, r * 0.5, len * 0.35, 8]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Antenna mast */}
      <mesh position={[0, r + 0.2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      <mesh position={[0, r + 0.38, 0]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
    </>
  );
}

function LifeSupportGeometry({ len, hovered }: GeoProps) {
  const r = 0.35;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={4} />
      {/* External processing tanks */}
      {[-len * 0.15, len * 0.15].map((z, i) => (
        <group key={i} position={[r + 0.08, 0, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
            <DarkMaterial hovered={hovered} />
          </mesh>
        </group>
      ))}
      {/* Connecting pipe between tanks */}
      <mesh position={[r + 0.08, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, len * 0.35, 6]} />
        <EtchMaterial />
      </mesh>
    </>
  );
}

function HabitationGeometry({ len, hovered }: GeoProps) {
  const r = 0.38;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={8} seamCount={8} />
      {/* Bottom viewports */}
      {Array.from({ length: 4 }).map((_, i) => {
        const z = -len / 2 + 0.15 + (i / 3) * (len - 0.3);
        return (
          <mesh key={i} position={[0, -(r + 0.005), z]}>
            <planeGeometry args={[0.06, 0.06]} />
            <meshStandardMaterial
              color={windowGlow} emissive={windowGlow} emissiveIntensity={1.0}
              transparent opacity={0.5} side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

function ResearchGeometry({ len, hovered }: GeoProps) {
  const r = 0.35;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={5} />
      {/* Equipment box on top */}
      <mesh position={[0, r + 0.04, -len * 0.15]}>
        <boxGeometry args={[0.10, 0.05, 0.12]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Sensor dish on mast */}
      <mesh position={[0, r + 0.12, len * 0.2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 4]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      <mesh position={[0, r + 0.2, len * 0.2]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0, 0.08, 0.03, 12]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function PowerGeometry({ len, hovered }: GeoProps) {
  const r = 0.32;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={4} />
      {/* Solar panel arrays */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * (r + 0.12), 0.02, 0]}>
            <boxGeometry args={[0.2, 0.012, 0.012]} />
            <EtchMaterial />
          </mesh>
          <mesh position={[side * (r + 0.3), 0.03, 0]}>
            <boxGeometry args={[0.3, 0.008, len * 0.5]} />
            <meshStandardMaterial
              color={solarBlue}
              emissive={solarBlue}
              emissiveIntensity={hovered ? 0.15 : 0.05}
              metalness={0.3}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function CommsGeometry({ len, hovered }: GeoProps) {
  const r = 0.32;
  const dishR = 0.5;
  const mastH = 0.55;
  const feedH = 0.35; // height of feed horn above dish center
  const dishY = r + 0.08 + mastH; // Y of dish center
  const strutR = dishR * 0.7; // where struts attach to rim

  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={4} />
      {/* Mast base plate */}
      <mesh position={[0, r + 0.02, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.04, 8]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Main mast */}
      <mesh position={[0, r + 0.04 + mastH / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.03, mastH, 6]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Dish assembly — tilted toward sky */}
      <group position={[0, dishY, 0]} rotation={[-0.3, 0, 0]}>
        {/* Reflector dish — open cone (wide end is the face) */}
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[dishR, 0.12, 32, 1, true]} />
          <meshStandardMaterial
            color={metalColor}
            emissive={metalColor}
            emissiveIntensity={hovered ? 0.08 : 0.03}
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Dish back surface — slightly smaller to show rim thickness */}
        <mesh position={[0, 0.005, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[dishR * 0.95, 0.11, 32, 1, true]} />
          <meshStandardMaterial
            color={darkMetalColor}
            metalness={0.7}
            roughness={0.3}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Rim ring */}
        <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[dishR, 0.012, 6, 32]} />
          <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Feed horn — centered above dish */}
        <mesh position={[0, feedH, 0]}>
          <cylinderGeometry args={[0.015, 0.03, 0.07, 8]} />
          <DarkMaterial hovered={hovered} />
        </mesh>
        {/* 4 straight struts from rim to feed horn */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
          const rimX = Math.cos(angle) * strutR;
          const rimZ = Math.sin(angle) * strutR;
          const rimY = -0.04; // at dish surface
          // Strut goes from rim point to feed horn base
          const dx = -rimX;
          const dy = feedH - 0.03 - rimY;
          const dz = -rimZ;
          const strutLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const midX = rimX + dx / 2;
          const midY = rimY + dy / 2;
          const midZ = rimZ + dz / 2;
          // Rotation: align cylinder (Y-axis) with the strut direction
          const dir = new THREE.Vector3(dx, dy, dz).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), dir
          );
          const euler = new THREE.Euler().setFromQuaternion(quat);

          return (
            <mesh key={i} position={[midX, midY, midZ]} rotation={euler}>
              <cylinderGeometry args={[0.005, 0.005, strutLen, 4]} />
              <meshStandardMaterial color={darkMetalColor} metalness={0.6} roughness={0.4} />
            </mesh>
          );
        })}
      </group>
      {/* Signal indicator light on mast */}
      <mesh position={[0, r + 0.15, -0.04]}>
        <sphereGeometry args={[0.012, 6, 4]} />
        <meshStandardMaterial
          color="#00ff80"
          emissive={new THREE.Color('#00ff80')}
          emissiveIntensity={2.0}
        />
      </mesh>
    </>
  );
}

function MedicalGeometry({ len, hovered }: GeoProps) {
  const r = 0.32;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={4} />
      {/* Red cross on top */}
      <mesh position={[0, r + 0.005, 0]}>
        <boxGeometry args={[0.12, 0.006, 0.03]} />
        <meshStandardMaterial color="#aa2020" emissive={new THREE.Color('#ff3040')} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, r + 0.005, 0]}>
        <boxGeometry args={[0.03, 0.006, 0.12]} />
        <meshStandardMaterial color="#aa2020" emissive={new THREE.Color('#ff3040')} emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}

// --- Geodesic greenhouse dome ---

const growLightColor = new THREE.Color('#ffaa44');
const plantGreen = new THREE.Color('#2d6b3a');
const plantLight = new THREE.Color('#4a9e5c');
const glassColor = new THREE.Color('#88ccaa');

/** Build a geodesic hemisphere from an icosahedron, returning dome + edge geometries */
function createGeodesicDome(radius: number, detail: number) {
  const ico = new THREE.IcosahedronGeometry(radius, detail);
  const srcPos = ico.attributes.position;

  // Non-indexed geometry (detail > 0): every 3 consecutive vertices form a triangle
  const keepPositions: number[] = [];
  const keepNormals: number[] = [];
  const srcNormals = ico.attributes.normal;

  for (let i = 0; i < srcPos.count; i += 3) {
    const ay = srcPos.getY(i), by = srcPos.getY(i + 1), cy = srcPos.getY(i + 2);
    if (ay >= -0.001 && by >= -0.001 && cy >= -0.001) {
      for (let v = 0; v < 3; v++) {
        keepPositions.push(srcPos.getX(i + v), srcPos.getY(i + v), srcPos.getZ(i + v));
        keepNormals.push(srcNormals.getX(i + v), srcNormals.getY(i + v), srcNormals.getZ(i + v));
      }
    }
  }

  const dome = new THREE.BufferGeometry();
  dome.setAttribute('position', new THREE.Float32BufferAttribute(keepPositions, 3));
  dome.setAttribute('normal', new THREE.Float32BufferAttribute(keepNormals, 3));

  // EdgesGeometry with threshold 1° so all triangle edges show
  const edges = new THREE.EdgesGeometry(dome, 1);

  return { dome, edges };
}

/** Pre-compute greenhouse interior layout data */
function computeGreenhouseLayout(domeR: number) {
  const bedSpacing = 0.16;
  const numRows = Math.floor((domeR * 1.4) / bedSpacing);
  const bedW = 0.07;
  const bedH = 0.04;

  const seeded = (s: number) => {
    const v = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const dummy = new THREE.Object3D();
  const troughMatrices: THREE.Matrix4[] = [];
  const foliageMatrices: THREE.Matrix4[] = [];
  const lightPoleMatrices: THREE.Matrix4[] = [];
  const lightBarMatrices: THREE.Matrix4[] = [];

  // Grow beds + foliage
  for (let r = 0; r < numRows; r++) {
    const x = -domeR * 0.7 + bedSpacing * 0.5 + r * bedSpacing;
    const maxHalf = Math.sqrt(Math.max(0, (domeR * 0.82) ** 2 - x * x));
    if (maxHalf < 0.08) continue;
    const rowLen = maxHalf * 2;
    const seed = Math.abs(x * 73 + r * 31) | 0;

    // Trough — a long box for the planter bed
    dummy.position.set(x, 0.01 + bedH / 2, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(bedW, bedH, rowLen);
    dummy.updateMatrix();
    troughMatrices.push(dummy.matrix.clone());

    // Plant clumps along the row — squashed spheres sitting on top of beds
    const plantCount = Math.max(2, Math.floor(rowLen / 0.1));
    for (let p = 0; p < plantCount; p++) {
      const pz = -rowLen / 2 + 0.06 + (p / Math.max(plantCount - 1, 1)) * (rowLen - 0.12);
      const sz = 0.025 + seeded(seed + p * 3) * 0.015;
      const h = 0.015 + seeded(seed + p * 7 + 50) * 0.015;
      dummy.position.set(
        x + (seeded(seed + p * 5 + 100) - 0.5) * bedW * 0.5,
        0.01 + bedH + h,
        pz,
      );
      dummy.rotation.set(0, seeded(seed + p * 11) * Math.PI * 2, 0);
      dummy.scale.set(sz, h, sz);
      dummy.updateMatrix();
      foliageMatrices.push(dummy.matrix.clone());
    }
  }

  // Grow light fixtures
  const step = 0.5;
  for (let x = -domeR * 0.45; x <= domeR * 0.45; x += step) {
    const maxHalf = Math.sqrt(Math.max(0, (domeR * 0.75) ** 2 - x * x));
    if (maxHalf < 0.1) continue;
    const maxY = Math.sqrt(Math.max(0, domeR * domeR - x * x)) * 0.65;
    const height = Math.min(maxY, domeR * 0.5);
    const barLen = maxHalf * 1.4;

    // Pole
    dummy.position.set(x, height / 2, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    lightPoleMatrices.push(dummy.matrix.clone());

    // Light bar
    dummy.position.set(x, height - 0.008, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, barLen);
    dummy.updateMatrix();
    lightBarMatrices.push(dummy.matrix.clone());
  }

  return { troughMatrices, foliageMatrices, lightPoleMatrices, lightBarMatrices };
}

/** Instanced greenhouse interior — beds, plants, and grow lights as 4 draw calls */
function GreenhouseInterior({ domeR }: { domeR: number }) {
  const layout = useMemo(() => computeGreenhouseLayout(domeR), [domeR]);

  const troughRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const barRef = useRef<THREE.InstancedMesh>(null);

  // Apply matrices once refs are available
  const applied = useRef(false);
  useFrame(() => {
    if (applied.current) return;
    if (!troughRef.current || !foliageRef.current || !poleRef.current || !barRef.current) return;
    applied.current = true;

    for (let i = 0; i < layout.troughMatrices.length; i++)
      troughRef.current.setMatrixAt(i, layout.troughMatrices[i]);
    troughRef.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < layout.foliageMatrices.length; i++)
      foliageRef.current.setMatrixAt(i, layout.foliageMatrices[i]);
    foliageRef.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < layout.lightPoleMatrices.length; i++)
      poleRef.current.setMatrixAt(i, layout.lightPoleMatrices[i]);
    poleRef.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < layout.lightBarMatrices.length; i++)
      barRef.current.setMatrixAt(i, layout.lightBarMatrices[i]);
    barRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Bed troughs */}
      <instancedMesh ref={troughRef} args={[undefined, undefined, layout.troughMatrices.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a3028" roughness={0.9} metalness={0.05} />
      </instancedMesh>
      {/* Plant foliage — squashed green spheres */}
      <instancedMesh ref={foliageRef} args={[undefined, undefined, layout.foliageMatrices.length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial
          color={plantLight}
          emissive={plantGreen}
          emissiveIntensity={0.15}
          roughness={0.7}
        />
      </instancedMesh>
      {/* Light poles */}
      <instancedMesh ref={poleRef} args={[undefined, undefined, layout.lightPoleMatrices.length]}>
        <cylinderGeometry args={[0.006, 0.008, 1, 6]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.4} />
      </instancedMesh>
      {/* Light bars */}
      <instancedMesh ref={barRef} args={[undefined, undefined, layout.lightBarMatrices.length]}>
        <boxGeometry args={[0.018, 0.006, 1]} />
        <meshStandardMaterial color={growLightColor} emissive={growLightColor} emissiveIntensity={1.8} />
      </instancedMesh>
    </>
  );
}

function GreenhouseGeometry({ len }: GeoProps) {
  const domeR = len / 2;
  const portR = 0.06;

  const { dome, edges } = useMemo(() => createGeodesicDome(domeR, 2), [domeR]);

  return (
    <>
      {/* Geodesic glass panels — meshStandardMaterial instead of meshPhysicalMaterial */}
      <mesh geometry={dome}>
        <meshStandardMaterial
          color={glassColor}
          emissive={glassColor}
          emissiveIntensity={0.08}
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Geodesic frame struts */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={etchColor} transparent opacity={0.6} />
      </lineSegments>

      {/* Base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[domeR, 0.018, 6, 48]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Connection port collars */}
      {([-1, 1] as const).map((end) => (
        <group key={end} position={[0, 0, end * domeR]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[portR + 0.01, 0.012, 6, 12]} />
            <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[portR, portR, 0.08, 10]} />
            <meshStandardMaterial color={metalColor} emissive={metalColor} emissiveIntensity={0.03} metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Ground floor */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[domeR * 0.92, 32]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Central walkway */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, domeR * 1.5]} />
        <meshStandardMaterial color="#4a4038" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Instanced interior — beds, plants, lights as 4 draw calls */}
      <GreenhouseInterior domeR={domeR} />
    </>
  );
}

function AirlockGeometry({ len, hovered }: GeoProps) {
  const r = 0.30;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={2} seamCount={4} />
      {/* Amber warning lights */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * r * 0.6, r * 0.7, -len * 0.3]}>
          <sphereGeometry args={[0.018, 6, 4]} />
          <meshStandardMaterial
            color="#f0a000"
            emissive={new THREE.Color('#f0a000')}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </>
  );
}

function ObservatoryGeometry({ len, hovered }: GeoProps) {
  const r = 0.32;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={4} />
      {/* Observation dome */}
      <mesh position={[0, r * 0.6, 0]}>
        <sphereGeometry args={[r * 0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#6080a0"
          emissive={new THREE.Color('#8ab0d0')}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          metalness={0.15}
          roughness={0.2}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Dome ring */}
      <mesh position={[0, r * 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.55, 0.01, 6, 16]} />
        <EtchMaterial />
      </mesh>
    </>
  );
}

function WorkshopGeometry({ len, hovered }: GeoProps) {
  const r = 0.32;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={6} />
      {/* Overhead crane rail */}
      <mesh position={[0, r + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, len * 0.7, 4]} />
        <EtchMaterial />
      </mesh>
      {/* Crane trolley */}
      <mesh position={[0, r + 0.04, len * 0.1]}>
        <boxGeometry args={[0.06, 0.03, 0.05]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* External tool rack */}
      <mesh position={[r + 0.03, -0.02, -len * 0.15]}>
        <boxGeometry args={[0.04, 0.08, 0.15]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
    </>
  );
}

function RecreationGeometry({ len, hovered }: GeoProps) {
  const r = 0.35;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={6} seamCount={6} />
      {/* Larger viewports along sides */}
      {Array.from({ length: 3 }).map((_, i) => {
        const z = -len / 2 + 0.2 + (i / 2) * (len - 0.4);
        return (
          <group key={i}>
            <mesh position={[r + 0.005, 0, z]}>
              <planeGeometry args={[0.06, 0.06]} />
              <meshStandardMaterial
                color={windowGlow} emissive={windowGlow} emissiveIntensity={1.0}
                transparent opacity={0.6} side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[-(r + 0.005), 0, z]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.06, 0.06]} />
              <meshStandardMaterial
                color={windowGlow} emissive={windowGlow} emissiveIntensity={1.0}
                transparent opacity={0.6} side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function StorageGeometry({ len, hovered }: GeoProps) {
  const r = 0.35;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={2} seamCount={8} />
      {/* External cargo containers */}
      {[-len * 0.2, len * 0.2].map((z, i) => (
        <mesh key={i} position={[r + 0.06, -0.04, z]}>
          <boxGeometry args={[0.08, 0.08, 0.12]} />
          <meshStandardMaterial
            color={new THREE.Color('#8a7a60')}
            metalness={0.5}
            roughness={0.55}
          />
        </mesh>
      ))}
      {/* Loading rail on top */}
      <mesh position={[0, r + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, len * 0.8, 4]} />
        <EtchMaterial />
      </mesh>
    </>
  );
}

function BioProcessingGeometry({ len, hovered }: GeoProps) {
  const r = 0.33;
  const bioGreen = new THREE.Color('#2a8a4a');
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={4} seamCount={6} />
      {/* Bio-processing tanks on sides */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          {[-len * 0.2, len * 0.15].map((z, i) => (
            <group key={i} position={[side * (r + 0.06), -0.02, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.03, 0.06, 4, 8]} />
                <meshStandardMaterial
                  color={bioGreen}
                  emissive={bioGreen}
                  emissiveIntensity={hovered ? 0.25 : 0.1}
                  metalness={0.3}
                  roughness={0.5}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          ))}
          {/* Connecting pipe between tanks */}
          <mesh position={[side * (r + 0.06), -0.02, -len * 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, len * 0.4, 6]} />
            <EtchMaterial />
          </mesh>
        </group>
      ))}
      {/* Exhaust vent on top */}
      <mesh position={[0, r + 0.06, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 8]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
    </>
  );
}

function LogisticsGeometry({ len, hovered }: GeoProps) {
  const r = 0.36;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={4} seamCount={6} />
      {/* Overhead cargo rail — runs full length */}
      <mesh position={[0, r + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, len * 0.85, 4]} />
        <EtchMaterial />
      </mesh>
      {/* Cargo trolley on rail */}
      <mesh position={[0, r + 0.03, -len * 0.1]}>
        <boxGeometry args={[0.07, 0.04, 0.06]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Side-mounted cargo racks */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          {[-len * 0.25, 0, len * 0.25].map((z, i) => (
            <mesh key={i} position={[side * (r + 0.04), -0.04, z]}>
              <boxGeometry args={[0.06, 0.06, 0.08]} />
              <meshStandardMaterial
                color={new THREE.Color('#7a7060')}
                metalness={0.5}
                roughness={0.55}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function FabricationGeometry({ len, hovered }: GeoProps) {
  const r = 0.36;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={6} />
      {/* Robotic arm mount on top */}
      <mesh position={[0, r + 0.04, -len * 0.1]}>
        <boxGeometry args={[0.08, 0.05, 0.06]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Arm segment 1 — vertical */}
      <mesh position={[0.02, r + 0.12, -len * 0.1]}>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 6]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Arm segment 2 — angled */}
      <mesh position={[0.04, r + 0.18, -len * 0.05]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.008, 0.01, 0.12, 6]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Work table */}
      <mesh position={[r + 0.05, -0.06, len * 0.15]}>
        <boxGeometry args={[0.06, 0.04, 0.14]} />
        <DarkMaterial hovered={hovered} />
      </mesh>
      {/* Amber work light */}
      <mesh position={[0, r + 0.02, len * 0.3]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial
          color="#f0a000"
          emissive={new THREE.Color('#f0a000')}
          emissiveIntensity={1.0}
        />
      </mesh>
    </>
  );
}

function PassageGeometry({ len, hovered }: GeoProps) {
  const r = 0.24;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={2} seamCount={4} />
      {/* Emergency lighting strips along sides */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * r * 0.85, -r * 0.3, 0]}>
          <boxGeometry args={[0.008, 0.008, len * 0.7]} />
          <meshStandardMaterial
            color="#00d4e0"
            emissive={new THREE.Color('#00d4e0')}
            emissiveIntensity={hovered ? 0.8 : 0.4}
          />
        </mesh>
      ))}
    </>
  );
}

function DockingGeometry({ len, hovered }: GeoProps) {
  const r = 0.35;
  return (
    <>
      <CylindricalModule radius={r} length={len} hovered={hovered} portCount={3} seamCount={6} />
      {/* Docking ring at outer end */}
      <mesh position={[0, 0, len / 2 - 0.02]} rotation={[0, 0, 0]}>
        <torusGeometry args={[r * 0.75, 0.02, 8, 16]} />
        <meshStandardMaterial color={darkMetalColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Docking clamp arms */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const cx = Math.cos(angle) * r * 0.5;
        const cy = Math.sin(angle) * r * 0.5;
        return (
          <mesh key={i} position={[cx, cy, len / 2 + 0.02]}>
            <boxGeometry args={[0.03, 0.03, 0.06]} />
            <DarkMaterial hovered={hovered} />
          </mesh>
        );
      })}
      {/* Status beacons */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * r * 0.8, r * 0.5, len / 2 - 0.05]}>
          <sphereGeometry args={[0.015, 6, 4]} />
          <meshStandardMaterial
            color="#00ff40"
            emissive={new THREE.Color('#00ff40')}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </>
  );
}

// --- Geometry lookup ---

const geometryMap: Record<string, (props: GeoProps) => ReactNode> = {
  command: CommandGeometry,
  lifesupport: LifeSupportGeometry,
  habitation: HabitationGeometry,
  research: ResearchGeometry,
  power: PowerGeometry,
  comms: CommsGeometry,
  medical: MedicalGeometry,
  greenhouse: GreenhouseGeometry,
  greenhouse2: GreenhouseGeometry,
  greenhouse3: GreenhouseGeometry,
  airlock: AirlockGeometry,
  observatory: ObservatoryGeometry,
  workshop: WorkshopGeometry,
  recreation: RecreationGeometry,
  storage: StorageGeometry,
  storage2: StorageGeometry,
  bioprocessing: BioProcessingGeometry,
  logistics: LogisticsGeometry,
  fabrication: FabricationGeometry,
  passage1: PassageGeometry,
  passage2: PassageGeometry,
  docking: DockingGeometry,
  // Mars-specific modules mapped to closest existing geometry
  moxie: LifeSupportGeometry,
  waterprocessing: LifeSupportGeometry,
  garagebay: StorageGeometry,
  sabatier: BioProcessingGeometry,
  quarantine: MedicalGeometry,
  greenhouse4: GreenhouseGeometry,
  // Titan-specific modules
  'atmo-processor': LifeSupportGeometry,
  'cryo-lab': ResearchGeometry,
  // Europa-specific modules
  'rad-shield': PowerGeometry,
  // Ceres-specific modules
  'spin-gravity': RecreationGeometry,
  // Venus-specific modules
  'atmo-sampler': ObservatoryGeometry,
  // Phobos-specific modules
  'relay-comms': CommsGeometry,
  'fuel-depot': StorageGeometry,
};

// --- Main Module3D component ---

export function Module3D({ config, junctions }: Module3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const beacon1Ref = useRef<THREE.Mesh>(null);
  const beacon2Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const moduleStatus = useSimulation((s) => s.modules.find((m) => m.id === config.id));
  const setHoveredModule = useSimulation((s) => s.setHoveredModule);
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const status = moduleStatus?.status ?? 'nominal';
  const temperature = moduleStatus?.temperature ?? 21;
  const statusColor = statusColors[status];

  // Compute placement from junction layout
  const placement = useMemo(
    () => junctions ? genericGetModulePlacement(config, junctions) : moonGetModulePlacement(config),
    [config, junctions],
  );

  // Register with centralized animation manager instead of per-module useFrame
  const statusRef = useRef(status);
  statusRef.current = status;
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;

  useEffect(() => {
    moduleAnimRegistry.set(config.id, {
      groupRef,
      glowRef,
      beacon1Ref,
      beacon2Ref,
      getStatus: () => statusRef.current,
      getHovered: () => hoveredRef.current,
    });
    return () => { moduleAnimRegistry.delete(config.id); };
  }, [config.id]);

  const GeometryComponent = geometryMap[config.id];

  // Module geometry is rendered along local Z axis.
  // For horizontal modules (along world X), rotate -90° around Y.
  const moduleRotationY = placement.isHorizontal ? Math.PI / 2 : 0;

  // Hit area size
  const hitRadius = 0.25;

  return (
    <group position={[placement.cx, 0, placement.cz]}>
      {/* Hit area for hover */}
      <mesh
        visible={false}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([placement.cx, 0, placement.cz]); setSelectedModule(config.id); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); setHoveredModule(config.id); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); setHoveredModule(null); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[
          placement.isHorizontal ? placement.length : hitRadius * 2,
          0.6,
          placement.isHorizontal ? hitRadius * 2 : placement.length,
        ]} />
      </mesh>

      {/* Module geometry — lifts on hover */}
      <group ref={groupRef} rotation={[0, moduleRotationY, 0]}>
        {GeometryComponent && (
          <GeometryComponent
            len={placement.length}
            statusColor={statusColor}
            hovered={hovered}
          />
        )}
      </group>

      {/* Status glow — ground pool under the module */}
      <mesh ref={glowRef} position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[
          placement.isHorizontal ? placement.length * 0.8 : 0.5,
          placement.isHorizontal ? 0.5 : placement.length * 0.8,
        ]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.3} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Status beacons */}
      {[-1, 1].map((side, idx) => (
        <mesh
          key={`beacon-${side}`}
          ref={idx === 0 ? beacon1Ref : beacon2Ref}
          position={[
            placement.isHorizontal ? placement.length * 0.4 * side : 0,
            0.15,
            placement.isHorizontal ? 0 : placement.length * 0.4 * side,
          ]}
        >
          <sphereGeometry args={[0.012, 6, 4]} />
          <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Label — GPU-rendered text instead of Html for performance */}
      <Label3D text={config.shortName} position={[0, 0.45, 0]} />

      {/* Hover tooltip */}
      {hovered && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-panel/95 border border-panel-border rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm">
            <div className="font-mono text-xs text-cyan font-medium">{config.name}</div>
            <div className="font-mono text-[10px] text-text-secondary mt-1">{config.description}</div>
            <div className="font-mono text-[10px] text-text-dim mt-1">
              TEMP: <span className="text-text-primary">{temperature.toFixed(1)}°C</span>
              {' · '}
              STATUS: <span style={{ color: statusColor.getStyle() }}>{status.toUpperCase()}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
