import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// CeresGround — very dark rocky terrain
// ---------------------------------------------------------------------------

export function CeresGround({ center = [4, 5] }: { center?: [number, number] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], -0.2, center[1]]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial
        color="#1a1815"
        roughness={0.98}
        metalness={0.02}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// CeresRocks — dark rocks with grey highlights
// ---------------------------------------------------------------------------

export function CeresRocks({ center = [4, 4], spread = 22 }: { center?: [number, number]; spread?: number }) {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      const angle = seeded(i) * Math.PI * 2;
      const dist = 5 + seeded(i + 100) * spread;
      const x = center[0] + Math.cos(angle) * dist;
      const z = center[1] + Math.sin(angle) * dist;
      const scale = 0.04 + seeded(i + 200) * 0.15;
      dummy.position.set(x, -0.2 + scale * 0.3, z);
      dummy.rotation.set(seeded(i + 300) * Math.PI, seeded(i + 400) * Math.PI, seeded(i + 500) * Math.PI);
      dummy.scale.set(
        scale * (0.8 + seeded(i + 600) * 0.4),
        scale * (0.5 + seeded(i + 700) * 0.5),
        scale * (0.8 + seeded(i + 800) * 0.4),
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, center, spread]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#2a2520" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// CeresStarfield — dense, bright Milky Way visible
// ---------------------------------------------------------------------------

export function CeresStarfield() {
  const count = 2000;
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeded = (i: number) => {
      const v = Math.sin(i * 73.1 + 151.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2;
      const phi = seeded(i + 1000) * Math.PI;
      const r = 65 + seeded(i + 2000) * 10;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// CeresLight — harsh sun from one direction, very dark shadows
// ---------------------------------------------------------------------------

export function CeresLight() {
  return (
    <>
      <directionalLight position={[25, 15, -5]} intensity={2.0} color="#f0e8d0" />
      <directionalLight position={[-10, 5, 10]} intensity={0.15} color="#a0b0c0" />
    </>
  );
}
