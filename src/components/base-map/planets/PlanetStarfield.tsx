import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

const loader = new THREE.TextureLoader();
let cachedTexture: THREE.Texture | null = null;

/**
 * Sets the scene background to the equirectangular starfield texture.
 * Cleans up on unmount (restores null background).
 */
export function PlanetStarfield() {
  const { scene } = useThree();

  useEffect(() => {
    if (!cachedTexture) {
      cachedTexture = loader.load('/textures/starfield.jpg');
      cachedTexture.mapping = THREE.EquirectangularReflectionMapping;
    }
    scene.background = cachedTexture;
    return () => {
      scene.background = null;
    };
  }, [scene]);

  return null;
}
