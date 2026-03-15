import { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereGlowProps {
  radius?: number;
  color?: [number, number, number];
  power?: number;
  intensity?: number;
}

/**
 * Fresnel-based atmospheric rim glow — ported from project-tycho space-sim.
 * Renders a slightly larger sphere with a rim shader for atmospheric haze effect.
 */
export function AtmosphereGlow({
  radius = 1.05,
  color = [0.8, 0.4, 0.2],
  power = 3.0,
  intensity = 0.4,
}: AtmosphereGlowProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          float glow = pow(rim, uPower) * 1.5;
          vec3 col = mix(uColor, uColor * 1.3, rim);
          gl_FragColor = vec4(col, glow * uIntensity);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Vector3(color[0], color[1], color[2]) },
        uPower: { value: power },
        uIntensity: { value: intensity },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }, [color, power, intensity]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
}
