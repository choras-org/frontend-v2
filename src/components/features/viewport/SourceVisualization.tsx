import { useSelector, useDispatch } from "react-redux";
import { useRef, useEffect } from "react";
import { Text, TransformControls, Billboard } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { RootState } from "@/store";
import type { Source } from "@/types/simulation";
import { updateSource, selectSource, setIsTransforming } from "@/store/sourceReceiverSlice";
import { setActiveTab } from "@/store/tabSlice";
import { useSourceReceiverApi } from "@/hooks/useSourceReceiverApi";
import {
  OrbitControls as OrbitControlsType,
  TransformControls as TransformControlsType,
} from "three-stdlib";
import * as THREE from "three";

function SourcePoint({
  source,
  isSelected,
  onSourceClick,
  onSourceDoubleClick,
  onTransformEnd,
  orbitControlsRef,
}: {
  source: Source;
  isSelected: boolean;
  onSourceClick: (sourceId: string, event: ThreeEvent<MouseEvent>) => void;
  onSourceDoubleClick: (sourceId: string, event: ThreeEvent<MouseEvent>) => void;
  onTransformEnd: (sourceId: string, position: THREE.Vector3) => void;
  orbitControlsRef: React.RefObject<OrbitControlsType | null>;
}) {
  const dispatch = useDispatch();
  const { gl, scene } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<TransformControlsType | null>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.uuid = source.id;
    }
  }, [source.id]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[source.x, source.y, source.z]}
        onClick={(e) => {
          if (!isSelected) {
            onSourceClick(source.id, e);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onSourceDoubleClick(source.id, e);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          gl.domElement.style.cursor = isSelected ? "auto" : "pointer";
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "auto";
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (isSelected) {
            e.stopPropagation();
          }
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={source.isValid === false ? "#ef4444" : "#22d3ee"} />
      </mesh>

      <Billboard position={[source.x, source.y, source.z + 0.3]}>
        <Text
          fontSize={0.2}
          color={source.isValid === false ? "#dc2626" : "#06b6d4"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`${source.orderNumber}`}
        </Text>
      </Billboard>

      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={scene.getObjectByProperty("uuid", source.id) as THREE.Object3D}
          size={0.5}
          mode="translate"
          matrixAutoUpdate={false}
          onMouseDown={() => {
            dispatch(setIsTransforming(true));
            if (orbitControlsRef?.current) {
              orbitControlsRef.current.enabled = false;
            }
          }}
          onMouseUp={() => {
            dispatch(setIsTransforming(false));
            if (orbitControlsRef?.current) {
              orbitControlsRef.current.enabled = true;
            }

            const mesh = scene.getObjectByProperty("uuid", source.id) as THREE.Mesh;
            if (mesh) {
              const finalX = +mesh.position.x.toFixed(2);
              const finalY = +mesh.position.y.toFixed(2);
              const finalZ = +mesh.position.z.toFixed(2);

              onTransformEnd(source.id, new THREE.Vector3(finalX, finalY, finalZ));
            }
          }}
        />
      )}
    </group>
  );
}

interface SourceVisualizationProps {
  orbitControlsRef: React.RefObject<OrbitControlsType | null>;
}

export function SourceVisualization({ orbitControlsRef }: SourceVisualizationProps) {
  const dispatch = useDispatch();
  const sources = useSelector((state: RootState) => state.sourceReceiver.sources);
  const selectedSource = useSelector((state: RootState) => state.sourceReceiver.selectedSource);
  const { updateSimulationData } = useSourceReceiverApi();

  const handleSourceClick = (sourceId: string, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    dispatch(selectSource(selectedSource === sourceId ? null : sourceId));
  };

  const handleSourceDoubleClick = (sourceId: string, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    dispatch(selectSource(sourceId));
    dispatch(setActiveTab("sources"));
  };

  const handleTransformEnd = (sourceId: string, position: THREE.Vector3) => {
    dispatch(updateSource({ id: sourceId, field: "x", value: Number(position.x.toFixed(2)) }));
    dispatch(updateSource({ id: sourceId, field: "y", value: Number(position.y.toFixed(2)) }));
    dispatch(updateSource({ id: sourceId, field: "z", value: Number(position.z.toFixed(2)) }));

    const updatedSources = sources.map((source) =>
      source.id === sourceId
        ? {
            ...source,
            x: Number(position.x.toFixed(2)),
            y: Number(position.y.toFixed(2)),
            z: Number(position.z.toFixed(2)),
          }
        : source,
    );
    updateSimulationData(updatedSources);
  };

  return (
    <>
      {sources.map((source) => (
        <SourcePoint
          key={source.id}
          source={source}
          isSelected={selectedSource === source.id}
          onSourceClick={handleSourceClick}
          onSourceDoubleClick={handleSourceDoubleClick}
          onTransformEnd={handleTransformEnd}
          orbitControlsRef={orbitControlsRef}
        />
      ))}
    </>
  );
}
