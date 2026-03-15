import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { venusJunctions, venusModules } from '../../data/venus-config';
import { Module3D, ModuleAnimationManager } from './Module3D';
import { Junction3D } from './Junction3D';
import { Hallway3D } from './Hallway3D';

// ---------------------------------------------------------------------------
// VenusSky — golden/amber gradient sphere (no stars — thick atmosphere)
// ---------------------------------------------------------------------------

function VenusSky() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f0d060');   // bright gold zenith
    grad.addColorStop(0.3, '#d8a840'); // warm amber
    grad.addColorStop(0.6, '#c09030'); // deeper
    grad.addColorStop(0.85, '#a08028'); // near horizon
    grad.addColorStop(1, '#806020');   // bottom (below station)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[70, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// CloudLayer — animated cloud deck below the station
// ---------------------------------------------------------------------------

function CloudLayer() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };

    // Base cloud colour
    ctx.fillStyle = '#c09040';
    ctx.fillRect(0, 0, size, size);

    // Billowy cloud patches
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 80; i++) {
      const x = seeded(i) * size;
      const y = seeded(i + 100) * size;
      const r = 20 + seeded(i + 200) * 60;
      ctx.fillStyle = seeded(i + 300) > 0.5 ? '#d8b060' : '#a07828';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 0.3) * 0.05;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[4, -4, 5]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial
        map={texture}
        color="#c09040"
        emissive="#a08030"
        emissiveIntensity={0.15}
        roughness={0.9}
        metalness={0}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// GondolaHull — multi-deck enclosed hull that modules sit inside
// ---------------------------------------------------------------------------

function GondolaHull() {
  return (
    <group>
      {/* Main hull box — modules are enclosed within this */}
      <mesh position={[4, -0.1, 4]}>
        <boxGeometry args={[12.5, 1.2, 10.5]} />
        <meshStandardMaterial color="#706858" roughness={0.75} metalness={0.3} />
      </mesh>

      {/* Top deck plate */}
      <mesh position={[4, 0.55, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.5, 10.5]} />
        <meshStandardMaterial color="#807060" roughness={0.7} metalness={0.35} />
      </mesh>

      {/* Hull panel lines — horizontal */}
      {[-0.2, 0.1, 0.4].map((y, i) => (
        <mesh key={`hl-${i}`} position={[4, y, -1.25]}>
          <boxGeometry args={[12.5, 0.015, 0.015]} />
          <meshStandardMaterial color="#50483a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      {[-0.2, 0.1, 0.4].map((y, i) => (
        <mesh key={`hr-${i}`} position={[4, y, 9.25]}>
          <boxGeometry args={[12.5, 0.015, 0.015]} />
          <meshStandardMaterial color="#50483a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}

      {/* Hull panel lines — vertical dividers on sides */}
      {[-0.5, 2, 4, 6, 8.5].map((x, i) => (
        <mesh key={`vs-${i}`} position={[x, -0.1, -1.25]}>
          <boxGeometry args={[0.015, 1.2, 0.015]} />
          <meshStandardMaterial color="#50483a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      {[-0.5, 2, 4, 6, 8.5].map((x, i) => (
        <mesh key={`vn-${i}`} position={[x, -0.1, 9.25]}>
          <boxGeometry args={[0.015, 1.2, 0.015]} />
          <meshStandardMaterial color="#50483a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}

      {/* Viewports on hull sides */}
      {[1, 3, 5, 7].map((x, i) => (
        <mesh key={`wp-s-${i}`} position={[x, 0.1, -1.27]}>
          <planeGeometry args={[0.3, 0.15]} />
          <meshStandardMaterial
            color="#fff4c2"
            emissive="#fff4c2"
            emissiveIntensity={0.8}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
      {[1, 3, 5, 7].map((x, i) => (
        <mesh key={`wp-n-${i}`} position={[x, 0.1, 9.27]}>
          <planeGeometry args={[0.3, 0.15]} />
          <meshStandardMaterial
            color="#fff4c2"
            emissive="#fff4c2"
            emissiveIntensity={0.8}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Keel / structural beam underneath */}
      <mesh position={[4, -0.85, 4]}>
        <boxGeometry args={[10, 0.15, 0.3]} />
        <meshStandardMaterial color="#5a5040" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh position={[4, -0.85, 2]}>
        <boxGeometry args={[8, 0.1, 0.2]} />
        <meshStandardMaterial color="#5a5040" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh position={[4, -0.85, 6]}>
        <boxGeometry args={[8, 0.1, 0.2]} />
        <meshStandardMaterial color="#5a5040" roughness={0.8} metalness={0.4} />
      </mesh>

      {/* Railing / safety rail on top deck */}
      {[
        [-2.2, 0.85, -1.2], [-2.2, 0.85, 4], [-2.2, 0.85, 9.2],
        [10.2, 0.85, -1.2], [10.2, 0.85, 4], [10.2, 0.85, 9.2],
        [4, 0.85, -1.2], [4, 0.85, 9.2],
      ].map((p, i) => (
        <mesh key={`rp-${i}`} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
          <meshStandardMaterial color="#909080" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BuoyancyEnvelope — large elongated balloon above the station
// ---------------------------------------------------------------------------

function BuoyancyEnvelope() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = 6 + Math.sin(clock.elapsedTime * 0.4) * 0.05;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 24);
    geo.scale(6, 2.2, 4);
    return geo;
  }, []);

  return (
    <group ref={meshRef} position={[4, 6, 4]}>
      {/* Main gas envelope */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#c8a850"
          roughness={0.5}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Equatorial seam band */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.8, 0.04, 8, 48]} />
        <meshStandardMaterial color="#908040" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Longitudinal ribs */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`rib-${i}`} rotation={[0, (i * Math.PI) / 4, 0]}>
          <torusGeometry args={[3.6, 0.025, 6, 32, Math.PI]} />
          <meshStandardMaterial color="#908040" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* Nose cone accent */}
      <mesh position={[5.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#808060" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-5.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#808060" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SuspensionCables — cables from envelope down to gondola
// ---------------------------------------------------------------------------

function SuspensionCables() {
  const cables = useMemo(() => {
    const pts: [number, number][] = [
      [-1, 0], [9, 0], [-1, 8], [9, 8], [4, -1], [4, 9],
      [1, 4], [7, 4], // extra inner cables
    ];
    return pts;
  }, []);

  return (
    <>
      {cables.map(([x, z], i) => {
        const top = new THREE.Vector3(
          4 + (x - 4) * 0.35, 3.8, 4 + (z - 4) * 0.25,
        );
        const bot = new THREE.Vector3(x, -0.7, z);
        const mid = new THREE.Vector3(
          (top.x + bot.x) / 2 + (x - 4) * 0.08,
          1.5,
          (top.z + bot.z) / 2 + (z - 4) * 0.08,
        );
        const curve = new THREE.QuadraticBezierCurve3(bot, mid, top);
        const geo = new THREE.TubeGeometry(curve, 16, 0.025, 6, false);
        return (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial color="#707060" roughness={0.7} metalness={0.4} />
          </mesh>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// WindTurbines — horizontal axis turbines on station edges
// ---------------------------------------------------------------------------

function WindTurbines() {
  const blade1Ref = useRef<THREE.Group>(null);
  const blade2Ref = useRef<THREE.Group>(null);
  const blade3Ref = useRef<THREE.Group>(null);
  const blade4Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (blade1Ref.current) blade1Ref.current.rotation.z = t * 3;
    if (blade2Ref.current) blade2Ref.current.rotation.z = t * 2.5 + 1;
    if (blade3Ref.current) blade3Ref.current.rotation.z = t * 2.8 + 2;
    if (blade4Ref.current) blade4Ref.current.rotation.z = t * 2.2 + 3;
  });

  const Turbine = ({ position, bladeRef }: { position: [number, number, number]; bladeRef: React.RefObject<THREE.Group | null> }) => (
    <group position={position}>
      {/* Nacelle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35, 8]} />
        <meshStandardMaterial color="#909090" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Boom arm from hull */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#707070" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Blades */}
      <group ref={bladeRef} position={[0, 0, 0.2]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.02, 0.6, 0.01]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.4} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );

  return (
    <>
      <Turbine position={[-2.5, -0.3, 1]} bladeRef={blade1Ref} />
      <Turbine position={[10.5, -0.3, 1]} bladeRef={blade2Ref} />
      <Turbine position={[-2.5, -0.3, 7]} bladeRef={blade3Ref} />
      <Turbine position={[10.5, -0.3, 7]} bladeRef={blade4Ref} />
    </>
  );
}

// ---------------------------------------------------------------------------
// SolarPanels — panels on top of the gondola
// ---------------------------------------------------------------------------

function SolarPanels() {
  return (
    <>
      {/* Two solar panel arrays on top deck */}
      {[[-1.5, 0.7, 1.5], [9.5, 0.7, 1.5], [-1.5, 0.7, 6.5], [9.5, 0.7, 6.5]].map((p, i) => (
        <group key={`sp-${i}`} position={p as [number, number, number]}>
          {/* Panel */}
          <mesh rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[1.2, 0.02, 0.8]} />
            <meshStandardMaterial color="#2a4a7a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Panel frame */}
          <mesh rotation={[-0.3, 0, 0]} position={[0, -0.02, 0]}>
            <boxGeometry args={[1.3, 0.01, 0.9]} />
            <meshStandardMaterial color="#606060" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Support post */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 4]} />
            <meshStandardMaterial color="#707070" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// AntennaMast — communication antenna on top
// ---------------------------------------------------------------------------

function AntennaMast() {
  return (
    <group position={[4, 0.6, 0]}>
      {/* Mast */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#808080" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Dish */}
      <mesh position={[0, 2.3, 0]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c0c0b0" metalness={0.4} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Blinking light */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ff4040" emissive="#ff4040" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// WindStreaks — horizontal particle streaks showing wind
// ---------------------------------------------------------------------------

function WindStreaks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 120;

  const offsets = useMemo(() => {
    const arr: [number, number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 8,
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
      const x = ((4 + ox + t * 3 + phase * 10) % 30) - 15 + 4;
      dummy.position.set(x, oy, 4 + oz);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.scale.set(0.3 + Math.sin(t + phase) * 0.1, 0.005, 0.005);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#e0c060" transparent opacity={0.15} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// AcidDroplets — occasional sulfuric acid rain particles
// ---------------------------------------------------------------------------

function AcidDroplets() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 60;

  const offsets = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        4 + (Math.random() - 0.5) * 14,
        Math.random() * 8,
        4 + (Math.random() - 0.5) * 14,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const [ox, oy, oz] = offsets[i];
      const y = ((oy - t * 0.5 + i * 0.3) % 8) - 2;
      dummy.position.set(ox, y, oz);
      dummy.scale.setScalar(0.008);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#c0a030" transparent opacity={0.25} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// StationBob — wraps all station content with gentle vertical oscillation
// ---------------------------------------------------------------------------

function StationBob({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.06;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ---------------------------------------------------------------------------
// VenusScene
// ---------------------------------------------------------------------------

export function VenusScene() {
  return (
    <>
      {/* Warm fog for thick atmosphere feel */}
      <fog attach="fog" args={['#c0a050', 40, 80]} />

      {/* Bright, warm ambient — Venus has excellent diffuse light */}
      <ambientLight intensity={1.4} color="#e0c070" />
      {/* Diffuse sun — scattered through clouds */}
      <directionalLight position={[10, 15, -5]} intensity={2.0} color="#f0d870" />
      <directionalLight position={[-5, 8, 10]} intensity={0.8} color="#c0a050" />
      {/* Base area warm fill */}
      <pointLight position={[4, 3, 4]} intensity={1.2} color="#e0c060" distance={20} decay={2} />
      <pointLight position={[4, 6, 4]} intensity={0.6} color="#f0d870" distance={14} decay={2} />

      {/* Sky and clouds */}
      <VenusSky />
      <CloudLayer />
      <WindStreaks />
      <AcidDroplets />

      {/* Floating station */}
      <StationBob>
        {/* Gondola hull structure — modules sit inside */}
        <GondolaHull />
        <SuspensionCables />
        <SolarPanels />
        <AntennaMast />

        {/* Junctions */}
        {venusJunctions.map((j) => (
          <Junction3D key={j.id} config={j} />
        ))}

        {/* Hallways */}
        {venusModules.map((m) => (
          <Hallway3D key={`hw-${m.id}`} module={m} junctions={venusJunctions} />
        ))}

        {/* Modules */}
        <ModuleAnimationManager />
        {venusModules.map((m) => (
          <Module3D key={m.id} config={m} junctions={venusJunctions} />
        ))}

        {/* Turbines on hull sides */}
        <WindTurbines />

        {/* Envelope floats above */}
        <BuoyancyEnvelope />
      </StationBob>
    </>
  );
}
