import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import type { TitanWeatherData } from '../../lib/titan-simulation';
import { titanJunctions, titanModules } from '../../data/titan-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';
import { NuclearReactor3D } from './NuclearReactor3D';
import { MethaneHarvester3D } from './MethaneHarvester3D';
import { CryoPowerPlant3D } from './CryoPowerPlant3D';
import { AtmoProcessor3D } from './AtmoProcessor3D';

// ---------------------------------------------------------------------------
// TitanGround — warm orange-brown terrain with visible texture
// ---------------------------------------------------------------------------

function TitanGround() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#6a4828';
    ctx.fillRect(0, 0, 512, 512);

    // Terrain variation — sandy patches
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 300; i++) {
      const x = seeded(i) * 512;
      const y = seeded(i + 1000) * 512;
      const r = 5 + seeded(i + 2000) * 30;
      const lightness = seeded(i + 3000);
      ctx.globalAlpha = 0.15 + lightness * 0.15;
      ctx.fillStyle = lightness > 0.5 ? '#8a6838' : '#4a3018';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + seeded(i + 4000) * 0.5), seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine noise
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 2000; i++) {
      const x = seeded(i + 6000) * 512;
      const y = seeded(i + 7000) * 512;
      ctx.fillStyle = seeded(i + 8000) > 0.5 ? '#a08050' : '#3a2010';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.2, 5]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// TitanDunes — low sandy ridges visible on the terrain
// ---------------------------------------------------------------------------

function TitanDunes() {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    const seeded = (i: number) => {
      const v = Math.sin(i * 53.1 + 171.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      const angle = seeded(i) * Math.PI * 2;
      const dist = 8 + seeded(i + 100) * 20;
      const x = 4 + Math.cos(angle) * dist;
      const z = 5 + Math.sin(angle) * dist;
      const scaleX = 1.5 + seeded(i + 200) * 3;
      const scaleZ = 0.6 + seeded(i + 300) * 1.5;
      const scaleY = 0.08 + seeded(i + 400) * 0.15;
      dummy.position.set(x, -0.18, z);
      dummy.rotation.set(0, seeded(i + 500) * Math.PI, 0);
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#7a5830" roughness={0.9} metalness={0.02} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// MethaneLakes — multiple dark reflective pools near the base
// ---------------------------------------------------------------------------

function MethaneLakes() {
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const ref3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref1.current) ref1.current.position.y = -0.19 + Math.sin(t * 0.5) * 0.003;
    if (ref2.current) ref2.current.position.y = -0.19 + Math.sin(t * 0.4 + 1) * 0.003;
    if (ref3.current) ref3.current.position.y = -0.19 + Math.sin(t * 0.6 + 2) * 0.003;
  });

  const LakeMaterial = () => (
    <meshStandardMaterial
      color="#1a1208"
      roughness={0.05}
      metalness={0.95}
      emissive="#302010"
      emissiveIntensity={0.12}
    />
  );

  return (
    <>
      {/* Main lake — visible from overview */}
      <mesh ref={ref1} rotation={[-Math.PI / 2, 0, 0]} position={[-5, -0.19, 8]} scale={[5, 3.5, 1]}>
        <circleGeometry args={[1, 32]} />
        <LakeMaterial />
      </mesh>
      {/* Smaller pool near base */}
      <mesh ref={ref2} rotation={[-Math.PI / 2, 0, 0.3]} position={[-2, -0.19, 12]} scale={[2.5, 1.5, 1]}>
        <circleGeometry args={[1, 24]} />
        <LakeMaterial />
      </mesh>
      {/* Distant pool */}
      <mesh ref={ref3} rotation={[-Math.PI / 2, 0, -0.4]} position={[12, -0.19, 14]} scale={[3, 2, 1]}>
        <circleGeometry args={[1, 24]} />
        <LakeMaterial />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// TitanSky — dense orange atmosphere, no stars visible
// ---------------------------------------------------------------------------

function TitanSky() {
  const material = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#4a2a10');   // zenith — warm dark
    gradient.addColorStop(0.3, '#7a4820'); // mid — amber
    gradient.addColorStop(0.6, '#9a6030'); // lower — brighter orange
    gradient.addColorStop(1, '#b07838');   // horizon — orange haze glow
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[80, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// TitanRocks — orange-brown scattered rocks, visible against terrain
// ---------------------------------------------------------------------------

function TitanRocks() {
  const count = 180;
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
      const dist = 6 + seeded(i + 100) * 20;
      const x = 4 + Math.cos(angle) * dist;
      const z = 4 + Math.sin(angle) * dist;
      const scale = 0.05 + seeded(i + 200) * 0.15;
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
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a3418" roughness={0.9} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// MethaneRain — particle system when rain is active
// ---------------------------------------------------------------------------

function MethaneRain() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 400;

  const offsets = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 30,
        Math.random() * 12,
        (Math.random() - 0.5) * 30,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const weather = useSimulation.getState().weather as TitanWeatherData | undefined;
    if (!weather || !weather.methaneRainActive) {
      for (let i = 0; i < count; i++) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    const t = clock.elapsedTime;
    const intensity = weather.methaneRainIntensity;
    const visibleCount = Math.floor(count * intensity);

    for (let i = 0; i < count; i++) {
      if (i < visibleCount) {
        const [ox, oy, oz] = offsets[i];
        const y = ((oy - t * 3 + i * 0.1) % 12 + 12) % 12;
        dummy.position.set(4 + ox, y - 0.2, 5 + oz);
        dummy.scale.set(0.01, 0.15, 0.01);
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#c09040" transparent opacity={0.25} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// HazeParticles — atmospheric haze floating near ground
// ---------------------------------------------------------------------------

function HazeParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 50;

  const offsets = useMemo(() => {
    const arr: [number, number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 30,
        Math.random() * 2,
        (Math.random() - 0.5) * 30,
        Math.random() * Math.PI * 2,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [ox, oy, oz, phase] = offsets[i];
      dummy.position.set(
        4 + ox + Math.sin(t * 0.1 + phase) * 2,
        oy + Math.sin(t * 0.2 + phase) * 0.3,
        5 + oz + Math.cos(t * 0.08 + phase) * 2,
      );
      dummy.scale.set(2 + Math.sin(t * 0.3 + phase) * 0.5, 0.3, 2 + Math.cos(t * 0.3 + phase) * 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#a07838" transparent opacity={0.04} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// TitanLight — warm, diffuse through thick atmosphere
// ---------------------------------------------------------------------------

function TitanLight({ lightRef }: { lightRef: React.RefObject<THREE.DirectionalLight | null> }) {
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime * 0.015;
    lightRef.current.position.set(
      Math.cos(t) * 12,
      8 + Math.sin(t * 0.5) * 2,
      Math.sin(t) * 12,
    );
  });

  return <directionalLight ref={lightRef} position={[4, 8, 3]} intensity={1.2} color="#c09060" />;
}

// ---------------------------------------------------------------------------
// Rain fog effect
// ---------------------------------------------------------------------------

function TitanWeatherEffects({ sunRef }: { sunRef: React.RefObject<THREE.DirectionalLight | null> }) {
  const { scene } = useThree();

  useFrame(() => {
    const weather = useSimulation.getState().weather as TitanWeatherData | undefined;
    if (!weather) return;

    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      const rainEffect = weather.methaneRainActive ? weather.methaneRainIntensity * 0.5 : 0;
      fog.near = 18 - rainEffect * 8;
      fog.far = 50 - rainEffect * 15;
    }

    if (sunRef.current) {
      const dimming = weather.methaneRainActive ? weather.methaneRainIntensity * 0.3 : 0;
      sunRef.current.intensity = 1.2 * (1 - dimming);
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// TitanScene — main exported component
// ---------------------------------------------------------------------------

export function TitanScene() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Orange fog — thick but not too close */}
      <fog attach="fog" args={['#5a3818', 18, 50]} />

      {/* Strong warm ambient — Titan's atmosphere scatters light everywhere */}
      <ambientLight intensity={1.2} color="#c09060" />
      <TitanLight lightRef={sunRef} />
      <TitanWeatherEffects sunRef={sunRef} />
      {/* Atmospheric scatter fill */}
      <directionalLight position={[-5, 6, -3]} intensity={0.8} color="#b08050" />
      <directionalLight position={[8, 4, 10]} intensity={0.4} color="#a07040" />
      {/* Base area lighting */}
      <pointLight position={[4, 5, 5]} intensity={1.2} color="#d0a060" distance={25} decay={2} />
      <pointLight position={[-3, 3, 8]} intensity={0.6} color="#c09050" distance={15} decay={2} />

      {/* Terrain and environment */}
      <TitanGround />
      <TitanDunes />
      <TitanRocks />
      <TitanSky />
      <MethaneLakes />
      <HazeParticles />
      <MethaneRain />

      {/* Junctions */}
      {titanJunctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallway tubes */}
      {titanModules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} junctions={titanJunctions} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {titanModules.map((m) => (
        <Module3D key={m.id} config={m} junctions={titanJunctions} />
      ))}

      {/* Standalone facilities */}
      <NuclearReactor3D position={[12, -0.2, 8]} />
      <MethaneHarvester3D />
      <CryoPowerPlant3D />
      <AtmoProcessor3D />
    </>
  );
}
