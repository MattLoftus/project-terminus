import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { Label3D } from './Label3D';

const darkMetal = new THREE.Color('#5a6270');
const bladeColor = new THREE.Color('#c0c8d0');

// Darrieus-style vertical axis wind turbines, west of Mars base
const TURBINE_POSITIONS: [number, number, number][] = [
  [-5, 0, 3],
  [-5, 0, 6],
  [-5, 0, 9],
  [-8, 0, 4.5],
  [-8, 0, 7.5],
];

// Pre-computed blade offsets (3 blades per turbine at 120° intervals)
const BLADE_OFFSETS = [0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle) => ({
  angle,
  bx: Math.cos(angle) * 0.35,
  bz: Math.sin(angle) * 0.35,
  strutBx: Math.cos(angle) * 0.175,
  strutBz: Math.sin(angle) * 0.175,
}));

export function WindTurbine3D() {
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const bladeRefs = useRef<(THREE.Group | null)[]>([]);

  // Shared geometries and materials — created once, reused across all turbines
  const shared = useMemo(() => ({
    shaftGeo: new THREE.CylinderGeometry(0.03, 0.04, 2.4, 8),
    baseGeo: new THREE.CylinderGeometry(0.15, 0.18, 0.1, 8),
    housingGeo: new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8),
    capGeo: new THREE.SphereGeometry(0.04, 8, 6),
    bladeGeo: new THREE.BoxGeometry(0.02, 1.8, 0.15),
    strutGeo: new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4),
    darkMat: new THREE.MeshStandardMaterial({ color: darkMetal, metalness: 0.7, roughness: 0.35 }),
    darkMat2: new THREE.MeshStandardMaterial({ color: darkMetal, metalness: 0.6, roughness: 0.4 }),
    darkMat3: new THREE.MeshStandardMaterial({ color: darkMetal, metalness: 0.5, roughness: 0.45 }),
    bladeMat: new THREE.MeshStandardMaterial({ color: bladeColor, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide }),
  }), []);

  // Single useFrame for all 5 turbines
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < TURBINE_POSITIONS.length; i++) {
      const ref = bladeRefs.current[i];
      if (ref) ref.rotation.y = t * (0.8 + i * 0.15);
    }
  });

  return (
    <group>
      {TURBINE_POSITIONS.map((pos, i) => (
        <group key={i} position={[pos[0], pos[1] - 0.2, pos[2]]}>
          {/* Central shaft */}
          <mesh position={[0, 1.2, 0]} geometry={shared.shaftGeo} material={shared.darkMat} />
          {/* Base mount */}
          <mesh position={[0, 0.05, 0]} geometry={shared.baseGeo} material={shared.darkMat2} />
          {/* Generator housing */}
          <mesh position={[0, 0.2, 0]} geometry={shared.housingGeo} material={shared.darkMat3} />

          {/* Rotating blade assembly */}
          <group ref={(el) => { bladeRefs.current[i] = el; }} position={[0, 1.2, 0]}>
            {BLADE_OFFSETS.map(({ angle, bx, bz, strutBx, strutBz }, j) => (
              <group key={j}>
                <mesh position={[bx, 0, bz]} rotation={[0, -angle, 0]} geometry={shared.bladeGeo} material={shared.bladeMat} />
                <mesh position={[strutBx, 0.85, strutBz]} rotation={[0, -angle, Math.PI / 6]} geometry={shared.strutGeo} material={shared.darkMat} />
                <mesh position={[strutBx, -0.85, strutBz]} rotation={[0, -angle, -Math.PI / 6]} geometry={shared.strutGeo} material={shared.darkMat} />
              </group>
            ))}
          </group>

          {/* Top cap */}
          <mesh position={[0, 2.42, 0]} geometry={shared.capGeo} material={shared.darkMat} />
        </group>
      ))}

      {/* Click hit area */}
      <mesh
        visible={false}
        position={[-6.5, 0.5, 6]}
        onClick={(e) => { e.stopPropagation(); setFocusTarget([-6, 0, 6]); setSelectedModule('facility-wind'); }}
        onPointerEnter={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[6, 3, 8]} />
      </mesh>

      <Label3D text="WIND" position={[-6, 2.8, 6]} />
    </group>
  );
}
