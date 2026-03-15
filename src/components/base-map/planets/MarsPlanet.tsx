import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { PlanetStarfield } from './PlanetStarfield';
import { AtmosphereGlow } from './AtmosphereGlow';

function OrbitLine({ radius, inclination }: { radius: number; inclination: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([
        radius * Math.cos(angle),
        radius * Math.sin(angle) * Math.sin(inclination),
        radius * Math.sin(angle) * Math.cos(inclination),
      ]);
    }
    return pts;
  }, [radius, inclination]);

  return (
    <Line points={points} color="#cc8855" transparent opacity={0.4} lineWidth={1} />
  );
}

export function MarsPlanet() {
  const marsRef = useRef<THREE.Mesh>(null);
  const phobosRef = useRef<THREE.Mesh>(null);
  const deimosRef = useRef<THREE.Mesh>(null);
  const phobosAngle = useRef(0);
  const deimosAngle = useRef(Math.PI * 0.7);

  // Load a separate texture instance — MarsScene mutates the cached one with RepeatWrapping
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/textures/mars.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(() => {
    if (marsRef.current) marsRef.current.rotation.y += 0.00012;

    phobosAngle.current += 0.003 * 0.25;
    if (phobosRef.current) {
      phobosRef.current.position.set(
        2.8 * Math.cos(phobosAngle.current),
        2.8 * Math.sin(phobosAngle.current) * Math.sin(0.02),
        2.8 * Math.sin(phobosAngle.current) * Math.cos(0.02),
      );
      phobosRef.current.rotation.y += 0.0002;
    }

    deimosAngle.current += 0.0008 * 0.25;
    if (deimosRef.current) {
      deimosRef.current.position.set(
        5.5 * Math.cos(deimosAngle.current),
        5.5 * Math.sin(deimosAngle.current) * Math.sin(0.03),
        5.5 * Math.sin(deimosAngle.current) * Math.cos(0.03),
      );
      deimosRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <>
      <PlanetStarfield />
      <ambientLight intensity={0.25} color="#0a0808" />
      <directionalLight position={[5, 1, 3]} intensity={1.6} color="#ffeedd" />
      <directionalLight position={[-3, -1, -2]} intensity={0.3} color="#664422" />

      {/* Mars */}
      <mesh ref={marsRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={texture} bumpMap={texture} bumpScale={0.02} shininess={3} />
      </mesh>

      {/* Atmosphere */}
      <AtmosphereGlow radius={1.015} color={[0.8, 0.4, 0.2]} power={3.0} intensity={0.4} />

      {/* Phobos */}
      <mesh ref={phobosRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshPhongMaterial color="#8a7a6a" shininess={2} />
      </mesh>

      {/* Deimos */}
      <mesh ref={deimosRef}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshPhongMaterial color="#9a8a7a" shininess={2} />
      </mesh>

      {/* Orbital tracks */}
      <OrbitLine radius={2.8} inclination={0.02} />
      <OrbitLine radius={5.5} inclination={0.03} />
    </>
  );
}
