import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetStarfield } from './PlanetStarfield';

export function MoonPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  // Load a separate texture instance — MoonScene mutates the cached one with RepeatWrapping
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/textures/moon.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.00008;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.15} color="#0a0a0a" />
      <directionalLight position={[5, 1, 3]} intensity={1.8} color="#fffef0" />
      <directionalLight position={[-3, -1, -2]} intensity={0.2} color="#444444" />

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 128, 64]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}
