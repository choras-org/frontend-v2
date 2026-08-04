import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as THREE from "three";
import type { RootState } from "@/store";
import { meshRegistry } from "@/helpers/meshRegistry";
import {
  selectGeometry as selectGeometryAction,
  clearSelection as clearSelectionAction,
  addHighlightedMesh as addHighlightedMeshAction,
  addHighlightedMeshes as addHighlightedMeshesAction,
  removeHighlightedMesh as removeHighlightedMeshAction,
  removeHighlightedMeshes as removeHighlightedMeshesAction,
  clearHighlights as clearHighlightsAction,
  addSelectedGeometry as addSelectedGeometryAction,
  addSelectedGeometries as addSelectedGeometriesAction,
  removeSelectedGeometry as removeSelectedGeometryAction,
  removeSelectedGeometries as removeSelectedGeometriesAction,
  clearSelectedGeometries as clearSelectedGeometriesAction,
} from "@/store/geometrySelectionSlice";
import type { SelectedGeometry, SerializableGeometry } from "@/store/geometrySelectionSlice";

// Convert a mesh-based geometry (from a component) into the serializable form
// stored in Redux, registering the live mesh instance so it can be resolved
// again on read.
function toSerializable(geometry: SelectedGeometry): SerializableGeometry {
  meshRegistry.register(geometry.mesh);
  return {
    meshUuid: geometry.mesh.uuid,
    faceIndex: geometry.faceIndex,
    point: { x: geometry.point.x, y: geometry.point.y, z: geometry.point.z },
    materialId: geometry.materialId,
  };
}

// Resolve a serializable geometry back into a mesh-based one via the registry.
// Returns null if the mesh is no longer registered (e.g. after a model reload).
function fromSerializable(geometry: SerializableGeometry | null): SelectedGeometry | null {
  if (!geometry) return null;
  const mesh = meshRegistry.get(geometry.meshUuid);
  if (!mesh) return null;
  return {
    mesh,
    faceIndex: geometry.faceIndex,
    point: new THREE.Vector3(geometry.point.x, geometry.point.y, geometry.point.z),
    materialId: geometry.materialId,
  };
}

export function useGeometrySelection() {
  const dispatch = useDispatch();
  const {
    selectedGeometry: rawSelectedGeometry,
    highlightedMeshUuids,
    selectedGeometries: rawSelectedGeometries,
  } = useSelector((state: RootState) => state.geometrySelection);

  // Reconstruct mesh-based views from the serializable Redux state. Memoized on
  // the raw state so identity only changes when the selection actually changes.
  const selectedGeometry = useMemo(
    () => fromSerializable(rawSelectedGeometry),
    [rawSelectedGeometry],
  );

  const highlightedMeshesSet = useMemo(() => {
    const set = new Set<THREE.Mesh>();
    highlightedMeshUuids.forEach((uuid) => {
      const mesh = meshRegistry.get(uuid);
      if (mesh) set.add(mesh);
    });
    return set;
  }, [highlightedMeshUuids]);

  const selectedGeometries = useMemo(() => {
    const result: Record<string, SelectedGeometry> = {};
    Object.values(rawSelectedGeometries).forEach((geometry) => {
      const resolved = fromSerializable(geometry);
      if (resolved) result[geometry.meshUuid] = resolved;
    });
    return result;
  }, [rawSelectedGeometries]);

  const selectGeometry = useCallback(
    (geometry: SelectedGeometry | null) => {
      dispatch(selectGeometryAction(geometry ? toSerializable(geometry) : null));
    },
    [dispatch],
  );

  const clearSelection = useCallback(() => {
    dispatch(clearSelectionAction());
  }, [dispatch]);

  const addHighlightedMesh = useCallback(
    (mesh: THREE.Mesh) => {
      meshRegistry.register(mesh);
      dispatch(addHighlightedMeshAction(mesh.uuid));
    },
    [dispatch],
  );

  const removeHighlightedMesh = useCallback(
    (mesh: THREE.Mesh) => {
      dispatch(removeHighlightedMeshAction(mesh.uuid));
    },
    [dispatch],
  );

  const addHighlightedMeshes = useCallback(
    (meshes: THREE.Mesh[]) => {
      meshRegistry.registerMany(meshes);
      dispatch(addHighlightedMeshesAction(meshes.map((mesh) => mesh.uuid)));
    },
    [dispatch],
  );

  const removeHighlightedMeshes = useCallback(
    (meshUuids: string[]) => {
      dispatch(removeHighlightedMeshesAction(meshUuids));
    },
    [dispatch],
  );

  const clearHighlights = useCallback(() => {
    dispatch(clearHighlightsAction());
  }, [dispatch]);

  const addSelectedGeometry = useCallback(
    (geometry: SelectedGeometry) => {
      dispatch(addSelectedGeometryAction(toSerializable(geometry)));
    },
    [dispatch],
  );

  const addSelectedGeometries = useCallback(
    (geometries: SelectedGeometry[]) => {
      dispatch(addSelectedGeometriesAction(geometries.map(toSerializable)));
    },
    [dispatch],
  );

  const removeSelectedGeometry = useCallback(
    (meshUuid: string) => {
      dispatch(removeSelectedGeometryAction(meshUuid));
    },
    [dispatch],
  );

  const removeSelectedGeometries = useCallback(
    (meshUuids: string[]) => {
      dispatch(removeSelectedGeometriesAction(meshUuids));
    },
    [dispatch],
  );

  const clearSelectedGeometries = useCallback(() => {
    dispatch(clearSelectedGeometriesAction());
  }, [dispatch]);

  return {
    selectedGeometry,
    highlightedMeshes: highlightedMeshesSet,
    selectGeometry,
    clearSelection,
    addHighlightedMesh,
    addHighlightedMeshes,
    removeHighlightedMesh,
    removeHighlightedMeshes,
    clearHighlights,
    addSelectedGeometry,
    addSelectedGeometries,
    removeSelectedGeometry,
    removeSelectedGeometries,
    selectedGeometries,
    clearSelectedGeometries,
  };
}
