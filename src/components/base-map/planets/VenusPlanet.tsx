import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { PlanetStarfield } from './PlanetStarfield';
import { AtmosphereGlow } from './AtmosphereGlow';

export function VenusPlanet() {
  const venusRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const surfaceTexture = useTexture('/textures/venus.jpg');

  // Procedural cloud texture — swirling yellow-white bands
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base cloud color
    ctx.fillStyle = '#d4c8a0';
    ctx.fillRect(0, 0, 512, 256);

    // Banded structure
    for (let y = 0; y < 256; y += 8) {
      ctx.globalAlpha = 0.15 + Math.sin(y * 0.05) * 0.1;
      ctx.fillStyle = y % 16 < 8 ? '#e8dbb8' : '#b8a878';
      ctx.fillRect(0, y, 512, 8);
    }

    // Swirl features
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 40; i++) {
      const x = seeded(i) * 512;
      const y = seeded(i + 1000) * 256;
      const rx = 20 + seeded(i + 2000) * 60;
      const ry = 5 + seeded(i + 3000) * 15;
      ctx.fillStyle = seeded(i + 4000) > 0.5 ? '#f0e8c8' : '#a89868';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seeded(i + 5000) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(() => {
    // Venus rotates retrograde, very slowly
    if (venusRef.current) venusRef.current.rotation.y -= 0.000014;
    // Clouds rotate much faster (~4 day super-rotation)
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0003;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.3} color="#0c0a06" />
      <directionalLight position={[5, 1, 3]} intensity={1.9} color="#fff8e0" />
      <directionalLight position={[-3, -1, -2]} intensity={0.25} color="#554422" />

      {/* Venus surface */}
      <mesh ref={venusRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={surfaceTexture} bumpMap={surfaceTexture} bumpScale={0.01} shininess={2} />
      </mesh>

      {/* Dense cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.02, 64, 64]} />
        <meshPhongMaterial map={cloudTexture} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Thick atmosphere glow */}
      <AtmosphereGlow radius={1.05} color={[0.9, 0.8, 0.5]} power={2.5} intensity={0.5} />
    </>
  );
}
