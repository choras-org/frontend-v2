import { useMemo } from "react";
import { useModelLoader } from "./useModelLoader";
import type { SurfaceInfo } from "@/types/material";
import * as THREE from "three";

export function useSurfaces() {
  const { rhinoFiles, currentModelId } = useModelLoader();

  const surfaces = useMemo(() => {
    if (!currentModelId || !rhinoFiles[currentModelId]) return [];

    const modelData = rhinoFiles[currentModelId];
    if (!modelData?.object3D) return [];

    const surfaceList: SurfaceInfo[] = [];
    let meshCounter = 0;

    modelData.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCounter++;

        const geometry = child.geometry;
        const faceCount = geometry.index
          ? geometry.index.count / 3
          : geometry.attributes.position.count / 3;

        const area = calculateMeshArea(child);
        const volume = calculateMeshVolume(child);
        const boundingBox = calculateBoundingBox(child);
        const rhinoMaterialName = getRhinoMaterialName(child);

        const stableId = child.userData.attributes?.id || child.userData.rhinoId || child.uuid;

        const surface: SurfaceInfo = {
          id: stableId,
          name: child.name || `Surface ${meshCounter}`,
          meshId: child.userData.meshId || meshCounter,
          faceCount: Math.floor(faceCount),
          area,
          volume,
          boundingBox,
          rhinoMaterialName,
          mesh: child,
          layerId: child.userData.layerId,
        };

        if (!child.userData.meshId) {
          child.userData.meshId = meshCounter;
        }

        surfaceList.push(surface);
      }
    });

    return surfaceList;
  }, [currentModelId, rhinoFiles]);

  return surfaces;
}

function calculateMeshArea(mesh: THREE.Mesh): number {
  const geometry = mesh.geometry;

  if (!geometry.attributes.position) return 0;

  const positions = geometry.attributes.position.array;
  const indices = geometry.index?.array;

  let totalArea = 0;

  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = new THREE.Vector3(
        positions[indices[i] * 3],
        positions[indices[i] * 3 + 1],
        positions[indices[i] * 3 + 2],
      );
      const b = new THREE.Vector3(
        positions[indices[i + 1] * 3],
        positions[indices[i + 1] * 3 + 1],
        positions[indices[i + 1] * 3 + 2],
      );
      const c = new THREE.Vector3(
        positions[indices[i + 2] * 3],
        positions[indices[i + 2] * 3 + 1],
        positions[indices[i + 2] * 3 + 2],
      );

      const triangleArea =
        new THREE.Vector3()
          .crossVectors(new THREE.Vector3().subVectors(b, a), new THREE.Vector3().subVectors(c, a))
          .length() / 2;

      totalArea += triangleArea;
    }
  } else {
    for (let i = 0; i < positions.length; i += 9) {
      const a = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const b = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
      const c = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

      const triangleArea =
        new THREE.Vector3()
          .crossVectors(new THREE.Vector3().subVectors(b, a), new THREE.Vector3().subVectors(c, a))
          .length() / 2;

      totalArea += triangleArea;
    }
  }

  return totalArea;
}

function calculateMeshVolume(mesh: THREE.Mesh): number {
  const geometry = mesh.geometry;

  if (!geometry.attributes.position) return 0;

  const positions = geometry.attributes.position.array;
  const indices = geometry.index?.array;

  let totalVolume = 0;

  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = new THREE.Vector3(
        positions[indices[i] * 3],
        positions[indices[i] * 3 + 1],
        positions[indices[i] * 3 + 2],
      );
      const b = new THREE.Vector3(
        positions[indices[i + 1] * 3],
        positions[indices[i + 1] * 3 + 1],
        positions[indices[i + 1] * 3 + 2],
      );
      const c = new THREE.Vector3(
        positions[indices[i + 2] * 3],
        positions[indices[i + 2] * 3 + 1],
        positions[indices[i + 2] * 3 + 2],
      );

      const tetrahedronVolume = a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
      totalVolume += tetrahedronVolume;
    }
  } else {
    for (let i = 0; i < positions.length; i += 9) {
      const a = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const b = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
      const c = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

      const tetrahedronVolume = a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
      totalVolume += tetrahedronVolume;
    }
  }

  return Math.abs(totalVolume);
}

function calculateBoundingBox(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  if (!geometry.boundingBox) return undefined;

  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  return {
    min: box.min.clone(),
    max: box.max.clone(),
    size,
    center,
  };
}

function getRhinoMaterialName(mesh: THREE.Mesh): string | undefined {
  const userStrings = mesh.userData.attributes?.geometry?.userStrings;
  if (!userStrings || !Array.isArray(userStrings)) return undefined;

  const materialString = userStrings.find((str: [string, string]) => str[0] === "material_name");
  return materialString ? materialString[1] : undefined;
}
