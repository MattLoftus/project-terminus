import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Route = [number, number][];

// Routes for Mars base crew dots
const ROUTES: Route[] = [
  // Base core loop (operations → habitation → agriculture)
  [[0, 0], [5, 0], [10, 0], [15, 0], [15, 5], [15, 10], [10, 10], [5, 10], [0, 10], [0, 5], [0, 0]],
  // Habitation row
  [[0, 5], [5, 5], [10, 5], [15, 5]],
  // South industrial corridor
  [[0, 10], [0, 15], [5, 15], [10, 15]],
  // Road to landing field
  [[0, 7.5], [0, 15], [-6, 15], [-6, 22]],
  // Road to ice mine
  [[17, 7.5], [20, 7.5], [20, 12]],
  // Wind turbine access
  [[-3, 7.5], [-5, 7.5], [-5, 3]],
];

const DOT_COUNT = 8;
const DOT_Y = 0.12;
const SPEED = 0.6; // units per second

function computeDistances(route: Route): number[] {
  const dists = [0];
  for (let i = 1; i < route.length; i++) {
    const dx = route[i][0] - route[i - 1][0];
    const dz = route[i][1] - route[i - 1][1];
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dz * dz));
  }
  return dists;
}

function interpolateRoute(route: Route, dists: number[], t: number): [number, number] {
  const totalLen = dists[dists.length - 1];
  const d = ((t % totalLen) + totalLen) % totalLen;
  for (let i = 1; i < dists.length; i++) {
    if (d <= dists[i]) {
      const segLen = dists[i] - dists[i - 1];
      const frac = segLen > 0 ? (d - dists[i - 1]) / segLen : 0;
      return [
        route[i - 1][0] + (route[i][0] - route[i - 1][0]) * frac,
        route[i - 1][1] + (route[i][1] - route[i - 1][1]) * frac,
      ];
    }
  }
  return route[route.length - 1];
}

export function MarsCrewDots3D() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const dotRoutes = useMemo(() => {
    const assignments: { route: Route; dists: number[]; offset: number }[] = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      const routeIdx = i % ROUTES.length;
      const route = ROUTES[routeIdx];
      const dists = computeDistances(route);
      assignments.push({ route, dists, offset: (i * 3.7) });
    }
    return assignments;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < DOT_COUNT; i++) {
      const { route, dists, offset } = dotRoutes[i];
      const d = t * SPEED + offset;
      const [x, z] = interpolateRoute(route, dists, d);
      dummy.position.set(x, DOT_Y, z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DOT_COUNT]}>
      <sphereGeometry args={[0.06, 6, 4]} />
      <meshStandardMaterial
        color="#c0a080"
        emissive={new THREE.Color('#c0a080')}
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}
