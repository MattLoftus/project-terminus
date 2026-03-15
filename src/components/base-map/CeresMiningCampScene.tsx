import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CeresGround, CeresRocks, CeresStarfield, CeresLight } from './CeresEnvironment';

// ---------------------------------------------------------------------------
// Automated mining rig — simplified version of the main base's rigs
// ---------------------------------------------------------------------------

function AutoMiner({ position, rigId }: { position: [number, number, number]; rigId: string }) {
  const armRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!armRef.current) return;
    const t = clock.elapsedTime;
    // Slow drilling bob
    armRef.current.position.y = Math.sin(t * 0.8 + rigId.charCodeAt(rigId.length - 1)) * 0.08;
  });

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#3a3530" roughness={0.9} metalness={0.3} />
      </mesh>
      {/* Drill arm */}
      <group ref={armRef}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#555045" roughness={0.8} metalness={0.4} />
        </mesh>
        {/* Drill bit */}
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshStandardMaterial color="#6a6055" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>
      {/* Status light */}
      <mesh position={[0.3, 0.35, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#00e0a0" emissive="#00e0a0" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Ore bin — collection containers
// ---------------------------------------------------------------------------

function OreBin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.4]} />
        <meshStandardMaterial color="#2a2520" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* Fill level indicator */}
      <mesh position={[0, 0.15, 0.21]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#1a4030" emissive="#00e0a0" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Relay antenna — communication link back to Dawn Station
// ---------------------------------------------------------------------------

function RelayAntenna({ position }: { position: [number, number, number] }) {
  const dishRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!dishRef.current) return;
    // Slow tracking rotation
    dishRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.3;
  });

  return (
    <group position={position}>
      {/* Mast */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.6, 6]} />
        <meshStandardMaterial color="#4a4540" roughness={0.8} metalness={0.4} />
      </mesh>
      {/* Dish */}
      <mesh ref={dishRef} position={[0, 1.6, 0]} rotation={[0.4, 0, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshStandardMaterial color="#555050" roughness={0.6} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Signal light */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color="#00e0a0" emissive="#00e0a0" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Rover tracks — marks on the ground
// ---------------------------------------------------------------------------

function RoverTracks() {
  const tracks = useMemo(() => {
    const pts: [number, number, number, number][] = []; // x, z, angle, length
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 12; i++) {
      pts.push([
        1 + seeded(i + 9000) * 6,
        seeded(i + 9100) * 6,
        seeded(i + 9200) * Math.PI,
        0.5 + seeded(i + 9300) * 2,
      ]);
    }
    return pts;
  }, []);

  return (
    <>
      {tracks.map((t, i) => (
        <mesh
          key={i}
          position={[t[0], -0.19, t[1]]}
          rotation={[-Math.PI / 2, 0, t[2]]}
        >
          <planeGeometry args={[t[3], 0.06]} />
          <meshStandardMaterial color="#151210" roughness={1} transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mining dust — smaller scale than main base
// ---------------------------------------------------------------------------

function CampDust() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 60;

  const offsets = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 6,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 6,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [ox, oy, oz] = offsets[i];
      dummy.position.set(
        3 + ox + Math.sin(t * 0.3 + i) * 0.3,
        oy + Math.sin(t * 0.5 + i * 0.7) * 0.2,
        2 + oz + Math.cos(t * 0.4 + i) * 0.3,
      );
      dummy.scale.setScalar(0.008 + Math.sin(t + i) * 0.003);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#a09080" transparent opacity={0.25} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// CeresMiningCampScene
// ---------------------------------------------------------------------------

export function CeresMiningCampScene() {
  return (
    <>
      <ambientLight intensity={0.25} color="#808080" />
      <CeresLight />
      <pointLight position={[3, 3, 2]} intensity={0.4} color="#c0b090" distance={12} decay={2} />

      <CeresGround center={[3, 3]} />
      <CeresRocks center={[3, 3]} spread={15} />
      <CeresStarfield />
      <CampDust />
      <RoverTracks />

      {/* Automated mining rigs */}
      <AutoMiner position={[2, -0.2, 1]} rigId="camp-1" />
      <AutoMiner position={[4.5, -0.2, 0.5]} rigId="camp-2" />
      <AutoMiner position={[3, -0.2, 3.5]} rigId="camp-3" />

      {/* Ore collection bins */}
      <OreBin position={[1, -0.2, 2.5]} />
      <OreBin position={[5.5, -0.2, 2]} />

      {/* Relay antenna — comms link to Dawn Station */}
      <RelayAntenna position={[0, -0.2, 0]} />
    </>
  );
}
