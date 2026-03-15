import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DOT_Y = 0.05;
const dotColor = new THREE.Color('#a0b0c0');

// Routes in world-space [x, z] waypoints
const ROUTE_A: [number, number][] = [[0, 4], [4, 4], [4, 8], [0, 8], [0, 4]];
const ROUTE_B: [number, number][] = [[4, 12], [8, 12], [12, 12], [8, 12], [4, 12]];
const ROUTE_C: [number, number][] = [[0, 14], [-3, 14], [-3, 19], [-3, 14], [0, 14]];
const ROUTE_D: [number, number][] = [[0, 8], [4, 8], [4, 12], [0, 12], [0, 8]];

function getRouteLength(route: [number, number][]): number {
  let len = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const dx = route[i + 1][0] - route[i][0];
    const dz = route[i + 1][1] - route[i][1];
    len += Math.sqrt(dx * dx + dz * dz);
  }
  return len;
}

function CrewDot({ route, offset, speed }: {
  route: [number, number][];
  offset: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const totalLength = getRouteLength(route);

  // Precompute cumulative segment distances
  const segLengths: number[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const dx = route[i + 1][0] - route[i][0];
    const dz = route[i + 1][1] - route[i][1];
    segLengths.push(Math.sqrt(dx * dx + dz * dz));
  }

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Distance-based interpolation for uniform speed
    const dist = ((clock.elapsedTime * speed + offset * totalLength) % totalLength + totalLength) % totalLength;
    let accumulated = 0;
    for (let i = 0; i < segLengths.length; i++) {
      if (accumulated + segLengths[i] >= dist) {
        const segT = (dist - accumulated) / segLengths[i];
        const x = route[i][0] + (route[i + 1][0] - route[i][0]) * segT;
        const z = route[i][1] + (route[i + 1][1] - route[i][1]) * segT;
        ref.current.position.set(x, DOT_Y, z);
        return;
      }
      accumulated += segLengths[i];
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 6, 4]} />
      <meshStandardMaterial
        color={dotColor}
        emissive={dotColor}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export function CrewDots3D() {
  return (
    <>
      <CrewDot route={ROUTE_A} offset={0}   speed={0.4} />
      <CrewDot route={ROUTE_A} offset={0.5} speed={0.4} />
      <CrewDot route={ROUTE_B} offset={0}   speed={0.35} />
      <CrewDot route={ROUTE_C} offset={0}   speed={0.45} />
      <CrewDot route={ROUTE_D} offset={0.33} speed={0.5} />
      <CrewDot route={ROUTE_D} offset={0.66} speed={0.5} />
    </>
  );
}
