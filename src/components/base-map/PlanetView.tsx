import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { getBaseEntry } from '../../data/base-registry';

/** Reset camera and clean scene state for planet view */
function PlanetCamera() {
  const { camera, scene, gl } = useThree();
  useEffect(() => {
    // Fully clear scene state — fog, background, any leftover children from base
    scene.fog = null;
    scene.background = new THREE.Color('#000000');

    // Set clear color on renderer too
    gl.setClearColor('#000000', 1);

    // Reset camera
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 45;
      camera.updateProjectionMatrix();
    }

    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [camera, scene, gl]);
  return null;
}

/**
 * Planet orbital view — replaces the base scene when viewMode === 'planet'.
 * Each base registers its own PlanetScene component via the registry.
 */
export function PlanetView() {
  const baseType = useSimulation((s) => s.baseType);
  const entry = getBaseEntry(baseType);
  const PlanetScene = entry.PlanetScene;

  if (!PlanetScene) return null;

  return (
    <>
      <PlanetCamera />
      <PlanetScene />
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={20}
      />
    </>
  );
}
