import { Text, Billboard } from '@react-three/drei';

/** GPU-rendered label — replaces <Html> overlays for massive perf gain */
export function Label3D({ text, position, fontSize = 0.12 }: {
  text: string;
  position: [number, number, number];
  fontSize?: number;
}) {
  return (
    <Billboard position={position}>
      <Text
        fontSize={fontSize}
        letterSpacing={0.2}
        color="#6b7d94"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </Billboard>
  );
}
