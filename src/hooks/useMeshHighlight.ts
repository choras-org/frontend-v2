import { useCallback, useRef } from "react";
import * as THREE from "three";

const HIGHLIGHT_COLOR = 0x006600;
const ORIGINAL_COLOR_CACHE = new WeakMap<THREE.Material, number | THREE.Color>();

export function useMeshHighlight() {
  const cacheRef = useRef(ORIGINAL_COLOR_CACHE);

  const highlightMesh = useCallback((mesh: THREE.Mesh, color: number) => {
    if (!mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (!cacheRef.current.has(material)) {
        if (
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshBasicMaterial
        ) {
          cacheRef.current.set(material, material.color.getHex());
        }
      }

      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshBasicMaterial
      ) {
        material.color.setHex(color);
        material.needsUpdate = true;
      }
    });
  }, []);

  const restoreOriginalColor = useCallback((mesh: THREE.Mesh) => {
    if (!mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      const originalColor = cacheRef.current.get(material);
      if (originalColor !== undefined) {
        if (
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshBasicMaterial
        ) {
          if (typeof originalColor === "number") {
            material.color.setHex(originalColor);
          } else {
            material.color.copy(originalColor);
          }
          material.needsUpdate = true;
        }
      }
    });
  }, []);

  const setMeshBaseColor = useCallback((mesh: THREE.Mesh, color: number) => {
    if (!mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshBasicMaterial
      ) {
        cacheRef.current.set(material, color);
        material.color.setHex(color);
        material.needsUpdate = true;
      }
    });
  }, []);

  return {
    highlightMesh,
    restoreOriginalColor,
    setMeshBaseColor,
    HIGHLIGHT_COLOR,
  };
}
