import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { PlanetStarfield } from './PlanetStarfield';

export function EuropaPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture('/textures/europa.jpg');
  const bumpMap = useTexture('/textures/europa_bump.jpg');

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.00005;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.15} color="#060810" />
      <directionalLight position={[5, 1, 3]} intensity={1.4} color="#fffef0" />
      <directionalLight position={[-3, -1, -2]} intensity={0.2} color="#443322" />

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={texture} bumpMap={bumpMap} bumpScale={0.015} shininess={4} />
      </mesh>
    </>
  );
}
