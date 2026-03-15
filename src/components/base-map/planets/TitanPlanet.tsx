import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetStarfield } from './PlanetStarfield';
import { AtmosphereGlow } from './AtmosphereGlow';

export function TitanPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Orange-brown surface
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#8a5020');
    grad.addColorStop(0.3, '#6a4018');
    grad.addColorStop(0.5, '#7a4820');
    grad.addColorStop(0.7, '#5a3510');
    grad.addColorStop(1, '#8a5020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark hydrocarbon lake regions
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#201008';
    ctx.beginPath();
    ctx.ellipse(100, 30, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(350, 220, 30, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Surface variation
    ctx.globalAlpha = 0.15;
    const seeded = (i: number) => {
      const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = seeded(i) > 0.5 ? '#a06828' : '#4a2810';
      const x = seeded(i + 1000) * 512;
      const y = seeded(i + 2000) * 256;
      const r = 3 + seeded(i + 3000) * 15;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.00006;
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.2} color="#0a0604" />
      <directionalLight position={[5, 1, 3]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[-3, -1, -2]} intensity={0.15} color="#443320" />

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={texture} shininess={1} />
      </mesh>

      {/* Dense orange atmosphere */}
      <AtmosphereGlow radius={1.06} color={[0.7, 0.35, 0.05]} power={2.0} intensity={0.55} />
    </>
  );
}
