import { useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from "three";

interface CustomAxesHelperProps {
  size?: number;
}

export function CustomAxesHelper({ size = 25 }: CustomAxesHelperProps) {
  const xLineRef = useRef<LineSegments>(null);
  const yLineRef = useRef<LineSegments>(null);
  const zLineRef = useRef<LineSegments>(null);

  const createAxisGeometry = (axis: "x" | "y" | "z") => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(6);

    if (axis === "x") {
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = size;
      positions[4] = 0;
      positions[5] = 0;
    } else if (axis === "y") {
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = 0;
      positions[4] = size;
      positions[5] = 0;
    } else {
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = 0;
      positions[4] = 0;
      positions[5] = size;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  };

  const xGeometry = createAxisGeometry("x");
  const yGeometry = createAxisGeometry("y");
  const zGeometry = createAxisGeometry("z");

  const xMaterial = new LineBasicMaterial({ color: "#f093fb", linewidth: 3 });
  const yMaterial = new LineBasicMaterial({ color: "#4ecdc4", linewidth: 3 });
  const zMaterial = new LineBasicMaterial({ color: "#667eea", linewidth: 3 });

  return (
    <group>
      <lineSegments ref={xLineRef} geometry={xGeometry} material={xMaterial} />
      <lineSegments ref={yLineRef} geometry={yGeometry} material={yMaterial} />
      <lineSegments ref={zLineRef} geometry={zGeometry} material={zMaterial} />
    </group>
  );
}
