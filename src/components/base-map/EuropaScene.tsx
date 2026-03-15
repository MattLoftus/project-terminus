import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { europaJunctions, europaModules } from '../../data/europa-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';
import { NuclearReactor3D } from './NuclearReactor3D';
import { IceDrillStation3D } from './IceDrillStation3D';
import { RadiationShieldArray3D } from './RadiationShieldArray3D';

// ---------------------------------------------------------------------------
// EuropaGround — cracked ice surface
// ---------------------------------------------------------------------------

function EuropaGround() {
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

    // Base ice colour — pale blue-grey
    ctx.fillStyle = '#b8c8d8';
    ctx.fillRect(0, 0, size, size);

    // Large-scale tonal variation (darker / lighter patches)
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 40; i++) {
      const x = seeded(i) * size;
      const y = seeded(i + 1000) * size;
      const rx = 60 + seeded(i + 2000) * 150;
      const ry = 40 + seeded(i + 3000) * 100;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#90a8c0' : '#d0dce8';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crack network — thin dark lines across the surface
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#506878';
    for (let i = 0; i < 25; i++) {
      ctx.lineWidth = 0.5 + seeded(i + 6000) * 2;
      ctx.beginPath();
      let x = seeded(i + 7000) * size;
      let y = seeded(i + 8000) * size;
      ctx.moveTo(x, y);
      const segs = 4 + Math.floor(seeded(i + 9000) * 6);
      for (let s = 0; s < segs; s++) {
        x += (seeded(i * 10 + s + 10000) - 0.3) * 200;
        y += (seeded(i * 10 + s + 11000) - 0.3) * 200;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Reddish-brown linea (characteristic Europa feature)
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#8a6050';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = seeded(i + 12000) * size;
      let y = seeded(i + 13000) * size;
      ctx.moveTo(x, y);
      for (let s = 0; s < 3; s++) {
        x += (seeded(i * 5 + s + 14000) - 0.4) * 300;
        y += (seeded(i * 5 + s + 15000) - 0.4) * 300;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Fine surface noise
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = seeded(i + 16000) > 0.5 ? '#ffffff' : '#708090';
      ctx.fillRect(seeded(i + 17000) * size, seeded(i + 18000) * size, 2, 2);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.2, 5]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={texture}
        color="#c0d0e0"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Ice cracks — dark lines on surface
// ---------------------------------------------------------------------------

function IceCracks() {
  const geometry = useMemo(() => {
    const positions: number[] = [];

    // Generate crack network
    const cracks: [number, number, number, number][] = [
      // Major cracks across the surface
      [-20, -5, 25, 15],
      [-15, 8, 30, 12],
      [-10, -15, 20, 25],
      [5, -20, 8, 20],
      [15, -10, 18, 30],
      [-5, 20, 25, 22],
      [10, 15, 12, 30],
      // Near base
      [-3, 2, 12, 3],
      [2, 7, 8, 9],
      [6, -1, 10, 2],
    ];

    for (const [x1, z1, x2, z2] of cracks) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = -dz / len;
      const nz = dx / len;
      const hw = 0.03;
      const y = -0.19;
      positions.push(
        x1 + nx * hw, y, z1 + nz * hw,
        x1 - nx * hw, y, z1 - nz * hw,
        x2 + nx * hw, y, z2 + nz * hw,
        x1 - nx * hw, y, z1 - nz * hw,
        x2 - nx * hw, y, z2 - nz * hw,
        x2 + nx * hw, y, z2 + nz * hw,
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#304050" transparent opacity={0.6} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Jupiter — MASSIVE backdrop sphere
// ---------------------------------------------------------------------------

function Jupiter() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const w = 512;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Base warm tan
    ctx.fillStyle = '#c4a878';
    ctx.fillRect(0, 0, w, h);

    // Alternating belt / zone bands with soft edges
    const bands: { y: number; h: number; color: string }[] = [
      { y: 0.04, h: 0.05, color: '#8a6040' },   // NPR
      { y: 0.12, h: 0.04, color: '#d8c090' },   // NTZ
      { y: 0.18, h: 0.06, color: '#9a6a40' },   // NTB
      { y: 0.26, h: 0.05, color: '#dcc898' },   // NTrZ
      { y: 0.33, h: 0.07, color: '#8a5838' },   // NEB (dark)
      { y: 0.42, h: 0.06, color: '#e0cca0' },   // EZ (bright)
      { y: 0.50, h: 0.08, color: '#906040' },   // SEB (dark)
      { y: 0.60, h: 0.05, color: '#d8c498' },   // STrZ
      { y: 0.67, h: 0.06, color: '#9a6848' },   // STB
      { y: 0.75, h: 0.04, color: '#d0bc90' },   // STZ
      { y: 0.81, h: 0.05, color: '#887058' },   // SSTB
      { y: 0.90, h: 0.06, color: '#807060' },   // SPR
    ];
    for (const b of bands) {
      // Soft gradient edges
      const grad = ctx.createLinearGradient(0, (b.y - 0.01) * h, 0, (b.y + b.h + 0.01) * h);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.15, b.color);
      grad.addColorStop(0.85, b.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, (b.y - 0.01) * h, w, (b.h + 0.02) * h);
    }

    // Turbulence / swirls along band edges
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 80; i++) {
      const x = seeded(i) * w;
      const y = seeded(i + 1000) * h;
      const rx = 8 + seeded(i + 2000) * 25;
      const ry = 2 + seeded(i + 3000) * 6;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#e0d0a0' : '#705030';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Great Red Spot
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#b84030';
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.56, 22, 12, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d05040';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.56, 14, 7, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Spot ring
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#904030';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.56, 24, 14, -0.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[-20, 45, -60]} rotation={[0.1, 0, 0.05]}>
      <sphereGeometry args={[22, 64, 48]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// EuropaStarfield — dense, bright (no atmosphere)
// ---------------------------------------------------------------------------

function EuropaStarfield() {
  const count = 1500;
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
      <pointsMaterial color="#ffffff" size={0.08} sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// EuropaLight — dim sun, plus warm Jupiter reflected fill
// ---------------------------------------------------------------------------

function EuropaLight() {
  return (
    <>
      {/* Dim distant sun */}
      <directionalLight position={[20, 15, -10]} intensity={1.2} color="#e0e8f0" />
      {/* Jupiter reflected reddish fill */}
      <directionalLight position={[-15, 10, -20]} intensity={0.5} color="#c0a080" />
    </>
  );
}

// ---------------------------------------------------------------------------
// EuropaScene — main exported component
// ---------------------------------------------------------------------------

export function EuropaScene() {
  return (
    <>
      {/* No fog — no atmosphere on Europa */}

      {/* Dark ambient — stark shadows */}
      <ambientLight intensity={0.35} color="#8090a0" />
      <EuropaLight />
      {/* Base area fill lights */}
      <pointLight position={[4, 4, 4]} intensity={0.8} color="#a0c0e0" distance={18} decay={2} />
      <pointLight position={[4, 3, 8]} intensity={0.4} color="#80a0c0" distance={12} decay={2} />

      {/* Terrain */}
      <EuropaGround />
      <IceCracks />

      {/* Sky */}
      <EuropaStarfield />
      <Jupiter />

      {/* Junctions */}
      {europaJunctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallways */}
      {europaModules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} junctions={europaJunctions} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {europaModules.map((m) => (
        <Module3D key={m.id} config={m} junctions={europaJunctions} />
      ))}

      {/* Facilities */}
      <NuclearReactor3D position={[14, -0.2, 8]} />
      <IceDrillStation3D />
      <RadiationShieldArray3D />
    </>
  );
}
