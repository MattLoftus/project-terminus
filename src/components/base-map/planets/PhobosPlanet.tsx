import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetStarfield } from './PlanetStarfield';

export function PhobosPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Dark grey rocky surface
    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, 256, 128);

    // Crater features (Stickney crater prominent)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#201c18';
    ctx.beginPath();
    ctx.arc(80, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    // Stickney rim
    ctx.strokeStyle = '#4a4540';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Smaller craters
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 30; i++) {
      const x = seeded(i) * 256;
      const y = seeded(i + 1000) * 128;
      const r = 1 + seeded(i + 2000) * 8;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#252018';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grooves (characteristic Phobos feature)
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#2a2520';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(seeded(i + 3000) * 256, seeded(i + 4000) * 128);
      ctx.lineTo(seeded(i + 3000) * 256 + 80, seeded(i + 4000) * 128 + 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Irregular shape: stretched sphere
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32);
    geo.scale(1.0, 0.8, 0.7);
    return geo;
  }, []);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0003;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.12} color="#080808" />
      <directionalLight position={[5, 1, 3]} intensity={1.8} color="#f0e8d8" />
      <directionalLight position={[-3, -1, -2]} intensity={0.15} color="#443322" />

      <mesh ref={meshRef} geometry={geometry}>
        <meshPhongMaterial map={texture} bumpMap={texture} bumpScale={0.03} shininess={2} />
      </mesh>
    </>
  );
}
