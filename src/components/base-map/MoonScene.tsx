import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { modules, junctions } from '../../data/base-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';
import { SolarFarm3D } from './SolarFarm3D';
import { NuclearReactor3D } from './NuclearReactor3D';
import { ISRUPlant3D } from './ISRUPlant3D';
import { Roads3D } from './Roads3D';
import { LaunchPad3D } from './LaunchPad3D';
import { Rovers3D } from './Rovers3D';

function LunarGround() {
  const texture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };

    // Base — neutral grey regolith
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, size, size);

    // Large-scale tonal variation (highland/mare boundary hints)
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 50; i++) {
      const x = seeded(i) * size;
      const y = seeded(i + 1000) * size;
      const rx = 50 + seeded(i + 2000) * 130;
      const ry = 40 + seeded(i + 3000) * 90;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#606060' : '#909090';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crater rims — subtle circular features
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 35; i++) {
      const cx = seeded(i + 6000) * size;
      const cy = seeded(i + 7000) * size;
      const r = 6 + seeded(i + 8000) * 35;
      ctx.strokeStyle = seeded(i + 9000) > 0.5 ? '#8a8a8a' : '#5a5a5a';
      ctx.lineWidth = 1 + seeded(i + 10000) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Slight darkening inside craters
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#505050';
      ctx.fill();
      ctx.globalAlpha = 0.18;
    }

    // Ray patterns from impacts — lighter radial streaks
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#a0a0a0';
    for (let i = 0; i < 6; i++) {
      const cx = seeded(i + 11000) * size;
      const cy = seeded(i + 12000) * size;
      const rays = 4 + Math.floor(seeded(i + 13000) * 6);
      for (let r = 0; r < rays; r++) {
        const angle = seeded(i * 10 + r + 14000) * Math.PI * 2;
        const len = 30 + seeded(i * 10 + r + 15000) * 80;
        ctx.lineWidth = 1 + seeded(i * 10 + r + 16000) * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    // Fine regolith grain
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = seeded(i + 17000) > 0.5 ? '#999999' : '#5a5a5a';
      ctx.fillRect(seeded(i + 18000) * size, seeded(i + 19000) * size, 2, 2);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.2, 12]}>
      <planeGeometry args={[90, 90]} />
      <meshStandardMaterial
        map={texture}
        color="#9a9a9a"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}


/** Procedural rocks scattered around the base perimeter */
function LunarRocks() {
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
      let x: number, z: number, scale: number;

      if (i < 120) {
        // Ring rocks around the base (avoid the center)
        const angle = seeded(i) * Math.PI * 2;
        const dist = 8 + seeded(i + 100) * 20;
        x = 4 + Math.cos(angle) * dist;
        z = 6 + Math.sin(angle) * dist;
        scale = 0.04 + seeded(i + 200) * 0.12;
      } else {
        // Mining debris clustered near the mining site
        x = 27 + (seeded(i + 100) - 0.5) * 10;
        z = 10 + (seeded(i + 200) - 0.5) * 10;
        scale = 0.06 + seeded(i + 300) * 0.19;
      }

      dummy.position.set(x, -0.2 + scale * 0.3, z);
      dummy.rotation.set(
        seeded(i + 300) * Math.PI,
        seeded(i + 400) * Math.PI,
        seeded(i + 500) * Math.PI,
      );
      dummy.scale.set(
        scale * (0.8 + seeded(i + 600) * 0.4),
        scale * (0.5 + seeded(i + 700) * 0.5),
        scale * (0.8 + seeded(i + 800) * 0.4),
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#7a7a78" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

/** Starfield on upper hemisphere */
function Starfield() {
  const count = 600;
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeded = (i: number) => {
      const v = Math.sin(i * 73.1 + 151.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      // Random point on upper hemisphere, far away
      const theta = seeded(i) * Math.PI * 2;
      const phi = seeded(i + 1000) * Math.PI * 0.45; // upper 45° only
      const r = 55 + seeded(i + 2000) * 15;
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
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

function EarthRise() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.008; // very slow cycle (~13 min)
    ref.current.position.set(
      -30 + Math.sin(t * 0.3) * 8,
      6 + Math.sin(t) * 3,
      -45,
    );
  });

  return (
    <group ref={ref} position={[-30, 6, -45]}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshStandardMaterial
          color="#4a8ac0"
          emissive={new THREE.Color('#1a3a60')}
          emissiveIntensity={0.6}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      {/* Atmosphere rim */}
      <mesh>
        <sphereGeometry args={[3.7, 32, 32]} />
        <meshStandardMaterial
          color="#88bbee"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Cloud layer hints */}
      <mesh>
        <sphereGeometry args={[3.55, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function AnimatedSunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.02; // full rotation ~5 min
    const r = 14;
    ref.current.position.set(
      Math.cos(t) * r,
      8 + Math.sin(t * 0.5) * 3,
      Math.sin(t) * r,
    );
  });

  return <directionalLight ref={ref} position={[6, 10, 4]} intensity={1.5} color="#d0d8e8" />;
}

export function MoonScene() {
  return (
    <>
      {/* Fog for depth -- pushed back so base is fully lit */}
      <fog attach="fog" args={['#060a12', 30, 65]} />

      {/* Lighting -- brighter, still directional */}
      <ambientLight intensity={0.7} color="#8090a0" />
      <AnimatedSunLight />
      <directionalLight position={[-4, 6, -2]} intensity={0.5} color="#6080c0" />
      <pointLight position={[2, 2, -8]} intensity={0.4} color="#a08060" />
      <pointLight position={[2, 4, 2]} intensity={0.4} color="#00d4e0" distance={12} decay={2} />

      <LunarGround />
      <LunarRocks />
      <Starfield />

      {/* Junctions */}
      {junctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallway tubes between modules and junctions */}
      {modules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {modules.map((m) => (
        <Module3D key={m.id} config={m} />
      ))}

      {/* Solar farm -- east of Power Station */}
      <SolarFarm3D />

      {/* Standalone facilities */}
      <NuclearReactor3D />
      <ISRUPlant3D />
      <Roads3D />
      <LaunchPad3D />
      <Rovers3D />
      <EarthRise />
    </>
  );
}
