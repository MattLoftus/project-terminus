import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import type { MarsWeatherData } from '../../lib/mars-simulation';
import { marsJunctions, marsModules } from '../../data/mars-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';
import { NuclearReactor3D } from './NuclearReactor3D';
import { WindTurbine3D } from './WindTurbine3D';
import { LandingField3D } from './LandingField3D';
import { SabatierPlant3D } from './SabatierPlant3D';
import { IceMine3D } from './IceMine3D';
import { MarsWeatherStation3D } from './MarsWeatherStation3D';
import { MarsSolarFarm3D } from './MarsSolarFarm3D';
import { MarsRoads3D } from './MarsRoads3D';
import { CentralDome3D } from './CentralDome3D';

// ---------------------------------------------------------------------------
// MarsGround
// ---------------------------------------------------------------------------

function MarsGround() {
  const texture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base rusty-red fill
    ctx.fillStyle = '#8b4a2a';
    ctx.fillRect(0, 0, size, size);

    // Seeded random for reproducibility
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };

    // Large-scale colour variation (dark patches, lighter ridges)
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 60; i++) {
      const x = seeded(i) * size;
      const y = seeded(i + 1000) * size;
      const rx = 40 + seeded(i + 2000) * 120;
      const ry = 30 + seeded(i + 3000) * 80;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#6b3018' : '#a0603a';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine grain — small dust specks
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = seeded(i + 6000) > 0.5 ? '#5a2510' : '#b87050';
      const x = seeded(i + 7000) * size;
      const y = seeded(i + 8000) * size;
      const r = 1 + seeded(i + 9000) * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A few dark streaks (wind-blown dust)
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#3a1808';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const x = seeded(i + 10000) * size;
      const y = seeded(i + 11000) * size;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 60 + seeded(i + 12000) * 100, y + (seeded(i + 13000) - 0.5) * 20);
      ctx.stroke();
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.2, 14]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        map={texture}
        color="#c07a5e"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// MarsRocks
// ---------------------------------------------------------------------------

function MarsRocks() {
  const count = 250;
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

      if (i < 150) {
        // Ring rocks around the base
        const angle = seeded(i) * Math.PI * 2;
        const dist = 10 + seeded(i + 100) * 25;
        x = 7 + Math.cos(angle) * dist;
        z = 8 + Math.sin(angle) * dist;
        scale = 0.05 + seeded(i + 200) * 0.14;
      } else {
        // Rocks near ice mine area ~[20, 12]
        x = 20 + (seeded(i + 100) - 0.5) * 12;
        z = 12 + (seeded(i + 200) - 0.5) * 10;
        scale = 0.06 + seeded(i + 300) * 0.18;
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
      <meshStandardMaterial color="#8a5040" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// MarsSky — inverted sphere with gradient from salmon pink to dark ochre
// ---------------------------------------------------------------------------

function MarsSky() {
  const material = useMemo(() => {
    // Vertical gradient via a canvas texture
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#2a1a10'); // zenith (top = dark ochre)
    gradient.addColorStop(1, '#c4705a'); // equator (bottom = salmon pink)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.6,
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

// Phobos/Deimos removed — orbits too distant to be visible within camera range

// ---------------------------------------------------------------------------
// MarsStarfield — dimmed compared to Moon
// ---------------------------------------------------------------------------

function MarsStarfield() {
  const count = 500;
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeded = (i: number) => {
      const v = Math.sin(i * 73.1 + 151.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2;
      const phi = seeded(i + 1000) * Math.PI * 0.45;
      const r = 60 + seeded(i + 2000) * 15;
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
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation transparent opacity={0.5} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// MarsLight — animated sun, warmer and dimmer
// ---------------------------------------------------------------------------

function MarsLight({ lightRef }: { lightRef: React.RefObject<THREE.DirectionalLight | null> }) {
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime * 0.02;
    const r = 14;
    lightRef.current.position.set(
      Math.cos(t) * r,
      8 + Math.sin(t * 0.5) * 3,
      Math.sin(t) * r,
    );
  });

  return <directionalLight ref={lightRef} position={[6, 10, 4]} intensity={2.5} color="#e0c0a0" />;
}

// Nominal fog color and storm-shifted color
const nominalFogColor = new THREE.Color('#2a1810');
const stormFogColor = new THREE.Color('#8a5020');
const mixedFogColor = new THREE.Color();

function DustStormEffects({ sunRef }: { sunRef: React.RefObject<THREE.DirectionalLight | null> }) {
  const { scene } = useThree();

  useFrame(() => {
    const weather = useSimulation.getState().weather as MarsWeatherData | undefined;
    if (!weather) return;

    const intensity = weather.dustStormIntensity;
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      // Fog pulls in during storms
      fog.near = 35 - intensity * 20;  // 35 → 15
      fog.far = 70 - intensity * 35;   // 70 → 35
      // Color shifts more orange
      mixedFogColor.copy(nominalFogColor).lerp(stormFogColor, intensity);
      fog.color.copy(mixedFogColor);
    }

    // Dim sun during storms
    if (sunRef.current) {
      sunRef.current.intensity = 2.5 * (1 - intensity * 0.7); // 2.5 → 0.75
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// RegolithBerms — low walls flanking the base for radiation shielding
// ---------------------------------------------------------------------------

function RegolithBerms() {
  const count = 10;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    // Place berms along the sides of the main base rows
    const bermPositions: [number, number, number, boolean][] = [
      // Row 0 — operations (z=0), berms at z=-1.2 and z=1.2
      [-1, -0.15, -1.2, true],
      [12, -0.15, -1.2, true],
      // Row 1 — habitation (z=5), berms flanking
      [-1, -0.15, 3.8, true],
      [12, -0.15, 6.2, true],
      // Row 2 — agriculture (z=10), berms flanking
      [-1, -0.15, 8.8, true],
      [12, -0.15, 11.2, true],
      // Row 3 — industrial (z=15), berms flanking
      [-1, -0.15, 13.8, true],
      [8, -0.15, 16.2, true],
      // Side berms along east and west edges
      [-2.0, -0.15, 5, false],
      [17, -0.15, 5, false],
    ];
    for (let i = 0; i < Math.min(count, bermPositions.length); i++) {
      const [bx, by, bz, isHorizontal] = bermPositions[i];
      dummy.position.set(bx, by, bz);
      dummy.rotation.set(0, 0, 0);
      if (isHorizontal) {
        dummy.scale.set(3, 0.3, 0.8);
      } else {
        dummy.scale.set(0.8, 0.3, 3);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8a6050" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// MarsScene — main exported component
// ---------------------------------------------------------------------------

export function MarsScene() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Mars fog -- warm rusty, pushed back so base is well lit */}
      <fog attach="fog" args={['#2a1810', 35, 70]} />

      {/* Ambient lighting -- warm Mars light */}
      <ambientLight intensity={1.15} color="#b0a090" />
      <MarsLight lightRef={sunRef} />
      <DustStormEffects sunRef={sunRef} />
      <directionalLight position={[-4, 8, -2]} intensity={1.0} color="#c0a080" />
      <pointLight position={[7, 4, 7]} intensity={0.6} color="#e08050" distance={20} decay={2} />
      <pointLight position={[7, 3, 15]} intensity={0.4} color="#e07030" distance={15} decay={2} />

      {/* Terrain and environment */}
      <MarsGround />
      <MarsRocks />
      <MarsSky />
      <MarsStarfield />
      <RegolithBerms />


      {/* Junctions */}
      {marsJunctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallway tubes between modules and junctions */}
      {marsModules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} junctions={marsJunctions} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {marsModules.map((m) => (
        <Module3D key={m.id} config={m} junctions={marsJunctions} />
      ))}

      {/* Central Dome — focal point of the Mars base */}
      <CentralDome3D />

      {/* Standalone facilities */}
      <NuclearReactor3D position={[18, -0.2, 24]} />
      <MarsSolarFarm3D />
      <WindTurbine3D />
      <LandingField3D />
      <SabatierPlant3D />
      <IceMine3D />
      <MarsWeatherStation3D />
      <MarsRoads3D />
    </>
  );
}
