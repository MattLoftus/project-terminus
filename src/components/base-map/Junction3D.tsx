import * as THREE from 'three';
import type { JunctionConfig } from '../../data/base-config';
import { JUNCTION_RADIUS, directionVector } from '../../data/base-config';

const hullColor = new THREE.Color('#c8d0d8');
const darkMetalColor = new THREE.Color('#5a6270');
const etchColor = new THREE.Color('#3e4855');

const PORT_LENGTH = JUNCTION_RADIUS * 0.6;
const PORT_RADIUS = 0.06;

interface Junction3DProps {
  config: JunctionConfig;
}

export function Junction3D({ config }: Junction3DProps) {
  const [x, z] = config.position;

  return (
    <group position={[x, 0, z]}>
      {/* Core hub — slightly flattened sphere */}
      <mesh>
        <sphereGeometry args={[JUNCTION_RADIUS, 16, 12]} />
        <meshStandardMaterial
          color={darkMetalColor}
          emissive={darkMetalColor}
          emissiveIntensity={0.02}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Equatorial ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[JUNCTION_RADIUS + 0.005, 0.012, 6, 16]} />
        <meshStandardMaterial color={etchColor} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Port stubs — one for each active direction */}
      {config.ports.map((dir) => {
        const [dx, dz] = directionVector(dir);
        // Position the port stub extending from the hub surface
        const px = dx * (JUNCTION_RADIUS + PORT_LENGTH / 2);
        const pz = dz * (JUNCTION_RADIUS + PORT_LENGTH / 2);
        // Rotation: cylinder is vertical by default, rotate to point in the right direction
        const rotY = Math.atan2(dx, dz);

        return (
          <group key={dir}>
            {/* Port tube */}
            <mesh position={[px, 0, pz]} rotation={[Math.PI / 2, 0, rotY]}>
              <cylinderGeometry args={[PORT_RADIUS, PORT_RADIUS, PORT_LENGTH, 12]} />
              <meshStandardMaterial
                color={hullColor}
                emissive={hullColor}
                emissiveIntensity={0.02}
                metalness={0.6}
                roughness={0.45}
              />
            </mesh>

            {/* Collar ring at port opening */}
            <group position={[dx * (JUNCTION_RADIUS + PORT_LENGTH), 0, dz * (JUNCTION_RADIUS + PORT_LENGTH)]}>
              <mesh rotation={[0, rotY, Math.PI / 2]}>
                <torusGeometry args={[PORT_RADIUS + 0.005, 0.008, 6, 12]} />
                <meshStandardMaterial color={etchColor} metalness={0.7} roughness={0.35} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
