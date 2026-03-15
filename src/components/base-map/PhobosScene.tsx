import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { phobosJunctions, phobosModules } from '../../data/phobos-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';

// ---------------------------------------------------------------------------
// PhobosGround — dark grey cratered terrain with procedural texture
// ---------------------------------------------------------------------------

function PhobosGround() {
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

    // Base — very dark grey-brown (Phobos is one of the darkest objects in the solar system)
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(0, 0, size, size);

    // Large-scale tonal variation — slightly lighter/darker patches
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 50; i++) {
      const x = seeded(i) * size;
      const y = seeded(i + 1000) * size;
      const rx = 40 + seeded(i + 2000) * 120;
      const ry = 30 + seeded(i + 3000) * 80;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#1a1612' : '#383028';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grooves — Phobos has characteristic parallel grooves across its surface
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#181410';
    for (let i = 0; i < 20; i++) {
      ctx.lineWidth = 1 + seeded(i + 6000) * 3;
      ctx.beginPath();
      let x = seeded(i + 7000) * size;
      let y = seeded(i + 8000) * size;
      ctx.moveTo(x, y);
      // Grooves tend to be roughly parallel — bias direction
      const baseAngle = 0.4 + seeded(i + 9000) * 0.3;
      const segs = 3 + Math.floor(seeded(i + 10000) * 5);
      for (let s = 0; s < segs; s++) {
        x += Math.cos(baseAngle) * (80 + seeded(i * 10 + s + 11000) * 120);
        y += Math.sin(baseAngle) * (80 + seeded(i * 10 + s + 12000) * 120) + (seeded(i * 10 + s + 13000) - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Crater rims — circular ring features
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 30; i++) {
      const cx = seeded(i + 14000) * size;
      const cy = seeded(i + 15000) * size;
      const r = 8 + seeded(i + 16000) * 40;
      ctx.strokeStyle = seeded(i + 17000) > 0.5 ? '#3a3028' : '#161210';
      ctx.lineWidth = 1 + seeded(i + 18000) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Darker interior
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#100e0a';
      ctx.fill();
      ctx.globalAlpha = 0.2;
    }

    // Fine regolith noise
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = seeded(i + 20000) > 0.6 ? '#3a3430' : '#141210';
      ctx.fillRect(seeded(i + 21000) * size, seeded(i + 22000) * size, 2, 2);
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.2, 3]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={texture}
        color="#302820"
        roughness={0.98}
        metalness={0.02}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// PhobosCraters — small impact craters on the surface
// ---------------------------------------------------------------------------

function PhobosCraters() {
  const count = 80;
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
      const dist = 4 + seeded(i + 100) * 18;
      const x = 3 + Math.cos(angle) * dist;
      const z = 3 + Math.sin(angle) * dist;
      const scale = 0.2 + seeded(i + 200) * 0.6;
      dummy.position.set(x, -0.22, z);
      dummy.rotation.set(-Math.PI / 2, 0, seeded(i + 300) * Math.PI * 2);
      dummy.scale.set(scale, scale, 0.05);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <torusGeometry args={[1, 0.15, 8, 16]} />
      <meshStandardMaterial color="#181410" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// PhobosRocks — scattered dark rocks
// ---------------------------------------------------------------------------

function PhobosRocks() {
  const count = 150;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    const seeded = (i: number) => {
      const v = Math.sin(i * 93.1 + 211.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      const angle = seeded(i) * Math.PI * 2;
      const dist = 3 + seeded(i + 100) * 20;
      const x = 3 + Math.cos(angle) * dist;
      const z = 3 + Math.sin(angle) * dist;
      const scale = 0.03 + seeded(i + 200) * 0.12;
      dummy.position.set(x, -0.2 + scale * 0.3, z);
      dummy.rotation.set(seeded(i + 300) * Math.PI, seeded(i + 400) * Math.PI, 0);
      dummy.scale.set(
        scale * (0.7 + seeded(i + 600) * 0.6),
        scale * (0.4 + seeded(i + 700) * 0.6),
        scale * (0.7 + seeded(i + 800) * 0.6),
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#282420" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// PhobosStarfield
// ---------------------------------------------------------------------------

function PhobosStarfield() {
  const count = 1800;
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
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Mars — huge red sphere in the sky (512x256 procedural texture)
// ---------------------------------------------------------------------------

function MarsBackdrop() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const w = 512;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };

    // Base rusty red gradient with latitude bands
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0, '#e8d0b0');    // north polar cap edge
    baseGrad.addColorStop(0.08, '#c07838');
    baseGrad.addColorStop(0.25, '#b06828');
    baseGrad.addColorStop(0.4, '#a05820');
    baseGrad.addColorStop(0.55, '#b86830');
    baseGrad.addColorStop(0.7, '#c07838');
    baseGrad.addColorStop(0.85, '#b06828');
    baseGrad.addColorStop(0.92, '#c07838');
    baseGrad.addColorStop(1, '#e0c8a8');    // south polar cap edge
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // Large-scale albedo features — dark regions (maria)
    ctx.globalAlpha = 0.3;
    // Syrtis Major
    ctx.fillStyle = '#502810';
    ctx.beginPath();
    ctx.ellipse(w * 0.39, h * 0.52, 30, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Acidalia Planitia
    ctx.fillStyle = '#584020';
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.32, 40, 18, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Mare Erythraeum
    ctx.fillStyle = '#503818';
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.58, 35, 14, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Sinus Meridiani
    ctx.fillStyle = '#4a3015';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.48, 18, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bright regions — Hellas, Argyre basins
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#d8b078';
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.7, 25, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d0a870';
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.68, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tharsis bulge — lighter region
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#d0a060';
    ctx.beginPath();
    ctx.ellipse(w * 0.18, h * 0.45, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olympus Mons — subtle circular feature
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#906030';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.12, h * 0.38, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Valles Marineris
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#401808';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.5);
    ctx.quadraticCurveTo(w * 0.35, h * 0.48, w * 0.5, h * 0.52);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.51);
    ctx.quadraticCurveTo(w * 0.35, h * 0.49, w * 0.5, h * 0.53);
    ctx.stroke();

    // Polar ice caps
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#f0e8e0';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, 4, 60, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h - 4, 50, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Turbulence / texture noise
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 100; i++) {
      const x = seeded(i) * w;
      const y = seeded(i + 1000) * h;
      const rx = 5 + seeded(i + 2000) * 20;
      const ry = 3 + seeded(i + 3000) * 8;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#d0a060' : '#704020';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine dust detail
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = seeded(i + 6000) > 0.5 ? '#d8b080' : '#603010';
      ctx.fillRect(seeded(i + 7000) * w, seeded(i + 8000) * h, 2, 2);
    }

    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.008;
    }
  });

  return (
    <mesh ref={meshRef} position={[-15, 40, -55]} rotation={[0.15, 0, 0.03]}>
      <sphereGeometry args={[20, 64, 48]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// MarsRelayAntenna — large dish pointed at Mars
// ---------------------------------------------------------------------------

function MarsRelayAntenna() {
  const dishRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (dishRef.current) {
      dishRef.current.rotation.y = -0.8 + Math.sin(clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group position={[7, -0.2, -2]}>
      {/* Base pedestal */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial color="#505050" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.0, 6]} />
        <meshStandardMaterial color="#606060" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Dish */}
      <group ref={dishRef} position={[0, 1.5, 0]}>
        <mesh rotation={[0.6, 0, 0]}>
          <sphereGeometry args={[0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Feed horn */}
        <mesh position={[0, 0.1, -0.4]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.3, 6]} />
          <meshStandardMaterial color="#808080" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Signal indicator */}
        <pointLight position={[0, 0.2, -0.3]} intensity={0.3} color="#ff4020" distance={2} decay={2} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// FuelTanks — tank farm with pipes
// ---------------------------------------------------------------------------

function FuelTanks() {
  return (
    <group position={[-2, -0.2, 5]}>
      {/* CH4 tanks */}
      {[0, 0.6].map((x, i) => (
        <group key={`ch4-${i}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <capsuleGeometry args={[0.15, 0.5, 6, 8]} />
            <meshStandardMaterial color="#c04040" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* LOX tanks */}
      {[0, 0.6, 1.2].map((x, i) => (
        <group key={`lox-${i}`} position={[x, 0, 0.8]}>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.18, 0.6, 6, 8]} />
            <meshStandardMaterial color="#4060c0" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Connecting pipes */}
      <mesh position={[0.3, 0.15, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
        <meshStandardMaterial color="#808080" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// DockingBays — spacecraft docking structure
// ---------------------------------------------------------------------------

function DockingStructure() {
  return (
    <group position={[3, -0.2, -2]}>
      {/* Docking arm structure */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.5, 0.15, 0.8]} />
        <meshStandardMaterial color="#505050" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Support pylons */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
          <meshStandardMaterial color="#606060" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Guide lights */}
      <pointLight position={[-0.6, 0.7, 0]} intensity={0.2} color="#00ff40" distance={1.5} decay={2} />
      <pointLight position={[0.6, 0.7, 0]} intensity={0.2} color="#00ff40" distance={1.5} decay={2} />
      {/* Bay markers */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={`mark-${i}`} position={[x, 0.68, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.4]} />
          <meshStandardMaterial color="#303030" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PhobosLight — normal solar + red reflected light from Mars
// ---------------------------------------------------------------------------

function PhobosLight() {
  return (
    <>
      <directionalLight position={[20, 15, -10]} intensity={1.8} color="#f0e8d8" />
      {/* Reddish Mars reflected fill */}
      <directionalLight position={[-15, 8, -10]} intensity={0.3} color="#c06030" />
      {/* Minimal fill on dark side */}
      <directionalLight position={[-5, 3, 10]} intensity={0.15} color="#a0a0c0" />
    </>
  );
}

// ---------------------------------------------------------------------------
// PhobosScene
// ---------------------------------------------------------------------------

export function PhobosScene() {
  return (
    <>
      {/* No fog — no atmosphere */}

      {/* Dark ambient */}
      <ambientLight intensity={0.3} color="#808080" />
      <PhobosLight />
      {/* Base area fill */}
      <pointLight position={[3, 3, 3]} intensity={0.5} color="#c0b0a0" distance={14} decay={2} />

      {/* Terrain */}
      <PhobosGround />
      <PhobosCraters />
      <PhobosRocks />
      <PhobosStarfield />

      {/* Mars backdrop */}
      <MarsBackdrop />

      {/* Junctions */}
      {phobosJunctions.map((j) => (
        <Junction3D key={j.id} config={j} />
      ))}

      {/* Hallways */}
      {phobosModules.map((m) => (
        <Hallway3D key={`hw-${m.id}`} module={m} junctions={phobosJunctions} />
      ))}

      {/* Modules */}
      <ModuleAnimationManager />
      {phobosModules.map((m) => (
        <Module3D key={m.id} config={m} junctions={phobosJunctions} />
      ))}

      {/* Facilities */}
      <MarsRelayAntenna />
      <FuelTanks />
      <DockingStructure />
    </>
  );
}
