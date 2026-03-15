import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetStarfield } from './PlanetStarfield';

export function CeresPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark rocky surface
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(0, 0, 512, 256);

    // Crater-like features
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 60; i++) {
      const x = seeded(i) * 512;
      const y = seeded(i + 1000) * 256;
      const r = 3 + seeded(i + 2000) * 20;
      // Crater rim (lighter)
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#4a4035';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // Crater floor (darker)
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#1a1510';
      ctx.fill();
    }

    // Bright spots (like Occator crater)
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.arc(200, 130, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(210, 135, 3, 0, Math.PI * 2);
    ctx.fill();

    // Surface variation
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = seeded(i + 5000) > 0.5 ? '#3a3530' : '#1a1510';
      ctx.fillRect(seeded(i + 6000) * 512, seeded(i + 7000) * 256, 2, 2);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0002;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.1} color="#080808" />
      <directionalLight position={[5, 1, 3]} intensity={1.6} color="#f0e8d0" />
      <directionalLight position={[-3, -1, -2]} intensity={0.1} color="#333333" />

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={texture} bumpMap={texture} bumpScale={0.02} shininess={2} />
      </mesh>
    </>
  );
}
