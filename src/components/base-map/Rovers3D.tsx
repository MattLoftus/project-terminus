import * as THREE from 'three';

const bodyColor = new THREE.Color('#b8c0c8');
const darkMetal = new THREE.Color('#5a6270');
const tireColor = new THREE.Color('#3a3a3a');
const solarBlue = new THREE.Color('#3a7eb8');

interface RoverProps {
  position: [number, number, number];
  rotation?: number; // Y rotation in radians
}

function Rover({ position, rotation = 0 }: RoverProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Chassis */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.35]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Cabin / instrument bay */}
      <mesh position={[0, 0.14, -0.04]}>
        <boxGeometry args={[0.16, 0.06, 0.18]} />
        <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Solar panel on top */}
      <mesh position={[0, 0.18, 0.02]}>
        <boxGeometry args={[0.2, 0.005, 0.15]} />
        <meshStandardMaterial
          color={solarBlue}
          emissive={solarBlue}
          emissiveIntensity={0.06}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>
      {/* Antenna */}
      <mesh position={[0.06, 0.25, -0.1]}>
        <cylinderGeometry args={[0.003, 0.003, 0.15, 4]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.06, 0.33, -0.1]}>
        <sphereGeometry args={[0.008, 4, 4]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* 4 wheels */}
      {([-1, 1] as const).map((side) =>
        ([-1, 1] as const).map((end) => (
          <mesh
            key={`${side}${end}`}
            position={[side * 0.13, 0.03, end * 0.12]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
            <meshStandardMaterial color={tireColor} roughness={0.9} metalness={0.1} />
          </mesh>
        ))
      )}
      {/* Roll cage bars */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * 0.08, 0.14, -0.12]}>
          <boxGeometry args={[0.01, 0.06, 0.01]} />
          <meshStandardMaterial color={darkMetal} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Rovers parked near the airlock area (southern part of base)
export function Rovers3D() {
  return (
    <group position={[0, -0.2, 0]}>
      <Rover position={[-0.8, 0, 13.5]} rotation={0.3} />
      <Rover position={[-1.3, 0, 14.2]} rotation={-0.5} />
      <Rover position={[0.8, 0, 14.5]} rotation={2.8} />
    </group>
  );
}
