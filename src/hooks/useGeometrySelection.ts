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
} from "@/store/geometrySelectionSlice";
import type { SelectedGeometry } from "@/store/geometrySelectionSlice";

export function useGeometrySelection() {
  const dispatch = useDispatch();
  const { selectedGeometry, highlightedMeshes } = useSelector(
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

  return {
    selectedGeometry,
    highlightedMeshes: highlightedMeshesSet,
    selectGeometry,
    clearSelection,
    addHighlightedMesh,
    removeHighlightedMesh,
    clearHighlights,
  };
}
