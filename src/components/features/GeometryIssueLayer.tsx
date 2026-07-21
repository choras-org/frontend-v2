import type { GeometryIssue } from "@/store/geometryIssueSlice";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "@/store";

const ISSUE_COLOR = "red";

// Get highlight color from CSS variable
function getHighlightColorFromCSS(): string {
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    const chroras_primary = getComputedStyle(root)
      .getPropertyValue("--color-choras-primary")
      .trim();
    if (chroras_primary) return chroras_primary;
  }
  return "#ef7305"; // CHORAS brand orange
}

function VertexMarker({
  position,
  color,
  size = 0.05,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function VertexIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const size = isSelected ? 0.1 : 0.05;
  const [x, y, z] = issue.points[0];

  return <VertexMarker position={[x, y, z]} color={issueColor} size={size} />;
}

// Highlight a single vertex of a face (its first vertex).
function FaceVertexIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const size = isSelected ? 0.1 : 0.05;
  if (issue.points.length === 0) return null;
  const [x, y, z] = issue.points[0];

  return <VertexMarker position={[x, y, z]} color={issueColor} size={size} />;
}

// Highlight a single vertex at the centroid (middle) of a face.
function FaceCentroidIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const size = isSelected ? 0.1 : 0.05;
  const pts = issue.points;
  if (pts.length === 0) return null;

  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const p of pts) {
    sx += p[0];
    sy += p[1];
    sz += p[2];
  }
  const position: [number, number, number] = [sx / pts.length, sy / pts.length, sz / pts.length];

  return <VertexMarker position={position} color={issueColor} size={size} />;
}

function EdgeIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const lineWidth = isSelected ? 6 : 2;

  return (
    <Line
      points={issue.points as [number, number, number][]}
      color={issueColor}
      lineWidth={lineWidth}
    />
  );
}

// Highlight every edge of a face (closed loop of the face's vertices).
function FaceEdgesIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const lineWidth = isSelected ? 6 : 2;
  const pts = issue.points as [number, number, number][];
  if (pts.length < 2) return null;

  return (
    <>
      {pts.map((point, index) => {
        const next = pts[(index + 1) % pts.length];
        return <Line key={index} points={[point, next]} color={issueColor} lineWidth={lineWidth} />;
      })}
    </>
  );
}

function FaceIssue({ issue, isSelected }: { issue: GeometryIssue; isSelected: boolean }) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(issue.points.flat());
  const highlightColor = useMemo(() => getHighlightColorFromCSS(), []);
  const issueColor = isSelected ? highlightColor : ISSUE_COLOR;
  const opacity = isSelected ? 0.5 : 0.1;
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  // Fan triangulation: works for any n-gon
  const numVertices = issue.points.length;
  const indices: number[] = [];

  for (let i = 1; i < numVertices - 1; i++) {
    indices.push(0, i, i + 1);
  }

  geometry.setIndex(indices);
  if (!isSelected) {
    return null;
  }

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshBasicMaterial
        color={issueColor}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthTest={false}
        // depthWrite={false}
        // polygonOffset={true}
        // polygonOffsetFactor={-1}
        // polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

// Per-issue-kind highlight overrides. A kind listed here is rendered with the
// given strategy instead of its raw element geometry. Kinds NOT listed fall
// back to the element's own type (vertex / edge / face) — i.e. current behaviour.
//   - "face-vertex":   one sphere at the face's first vertex
//   - "face-centroid": one sphere at the middle of the face
//   - "face-edges":    a line for every edge of the face
type HighlightMode = "face-vertex" | "face-centroid" | "face-edges";

const ISSUE_HIGHLIGHT_OVERRIDES: Record<string, HighlightMode> = {
  degenerate_face: "face-vertex",
  small_face: "face-centroid",
  collinear_face: "face-edges",
};

function IssueRenderer({
  issue,
  kind,
  selectedIssue,
}: {
  issue: GeometryIssue;
  kind: string;
  selectedIssue: GeometryIssue | null;
}) {
  const isSelected =
    selectedIssue?.id && issue.id
      ? selectedIssue.id === issue.id
      : selectedIssue?.type === issue.type &&
        JSON.stringify(selectedIssue?.points) === JSON.stringify(issue.points);

  const override = ISSUE_HIGHLIGHT_OVERRIDES[kind];
  if (override) {
    switch (override) {
      case "face-vertex":
        return <FaceVertexIssue issue={issue} isSelected={isSelected} />;
      case "face-centroid":
        return <FaceCentroidIssue issue={issue} isSelected={isSelected} />;
      case "face-edges":
        return <FaceEdgesIssue issue={issue} isSelected={isSelected} />;
    }
  }

  switch (issue.type) {
    case "vertex":
      return <VertexIssue issue={issue} isSelected={isSelected} />;
    case "edge":
      return <EdgeIssue issue={issue} isSelected={isSelected} />;
    case "face":
      return <FaceIssue issue={issue} isSelected={isSelected} />;
    default:
      return null;
  }
}

export function GeometryIssueLayer({ isRepair = false }: { isRepair: boolean }) {
  const { geometryIssues, selectedIssue, expandedIssueGroups, remainingIssues } = useSelector(
    (state: RootState) => {
      return state.geometryIssue;
    },
  );

  const issuesToRender = isRepair ? remainingIssues : geometryIssues;

  return (
    <>
      {issuesToRender &&
        Object.entries(issuesToRender).map(([issueType, issues]) => {
          if (!expandedIssueGroups[issueType]) return null;

          return issues.map((issue, index) => {
            return (
              <IssueRenderer
                key={`${issueType}-${index}`}
                issue={issue}
                kind={issueType}
                selectedIssue={selectedIssue}
              />
            );
          });
        })}
    </>
  );
}
