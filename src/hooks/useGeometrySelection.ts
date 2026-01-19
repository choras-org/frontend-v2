import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as THREE from "three";
import type { RootState } from "@/store";
import {
  selectGeometry as selectGeometryAction,
  clearSelection as clearSelectionAction,
  addHighlightedMesh as addHighlightedMeshAction,
  removeHighlightedMesh as removeHighlightedMeshAction,
  clearHighlights as clearHighlightsAction,
  addSelectedGeometry as addSelectedGeometryAction,
  removeSelectedGeometry as removeSelectedGeometryAction,
  clearSelectedGeometries as clearSelectedGeometriesAction,
} from "@/store/geometrySelectionSlice";
import type { SelectedGeometry } from "@/store/geometrySelectionSlice";

export function useGeometrySelection() {
  const dispatch = useDispatch();
  const { selectedGeometry, highlightedMeshes, selectedGeometries } = useSelector(
    (state: RootState) => state.geometrySelection,
  );

  const highlightedMeshesSet = useMemo(() => new Set(highlightedMeshes), [highlightedMeshes]);

  const selectGeometry = useCallback(
    (geometry: SelectedGeometry | null) => {
      dispatch(selectGeometryAction(geometry));
    },
    [dispatch],
  );

  const clearSelection = useCallback(() => {
    dispatch(clearSelectionAction());
  }, [dispatch]);

  const addHighlightedMesh = useCallback(
    (mesh: THREE.Mesh) => {
      dispatch(addHighlightedMeshAction(mesh));
    },
    [dispatch],
  );

  const removeHighlightedMesh = useCallback(
    (mesh: THREE.Mesh) => {
      dispatch(removeHighlightedMeshAction(mesh));
    },
    [dispatch],
  );

  const clearHighlights = useCallback(() => {
    dispatch(clearHighlightsAction());
  }, [dispatch]);

  const addSelectedGeometry = useCallback(
    (geometry: SelectedGeometry) => {
      dispatch(addSelectedGeometryAction(geometry));
    },
    [dispatch],
  );

  const removeSelectedGeometry = useCallback(
    (materialId: string) => {
      dispatch(removeSelectedGeometryAction(materialId));
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
    removeHighlightedMesh,
    clearHighlights,
    addSelectedGeometry,
    removeSelectedGeometry,
    selectedGeometries,
    clearSelectedGeometries,
  };
}
