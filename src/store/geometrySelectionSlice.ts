import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as THREE from "three";

export interface SelectedGeometry {
  mesh: THREE.Mesh;
  faceIndex: number;
  point: THREE.Vector3;
  materialId?: string;
}

interface GeometrySelectionState {
  selectedGeometry: SelectedGeometry | null;
  highlightedMeshes: THREE.Mesh[];
}

const initialState: GeometrySelectionState = {
  selectedGeometry: null,
  highlightedMeshes: [],
};

export const geometrySelectionSlice = createSlice({
  name: "geometrySelection",
  initialState,
  reducers: {
    selectGeometry: (state, action: PayloadAction<SelectedGeometry | null>) => {
      state.selectedGeometry = action.payload;
    },

    clearSelection: (state) => {
      state.selectedGeometry = null;
    },

    addHighlightedMesh: (state, action: PayloadAction<THREE.Mesh>) => {
      const mesh = action.payload;
      const exists = state.highlightedMeshes.find((m) => m.uuid === mesh.uuid);
      if (!exists) {
        state.highlightedMeshes.push(mesh);
      }
    },

    removeHighlightedMesh: (state, action: PayloadAction<THREE.Mesh>) => {
      const meshUuid = action.payload.uuid;
      state.highlightedMeshes = state.highlightedMeshes.filter((mesh) => mesh.uuid !== meshUuid);
    },

    clearHighlights: (state) => {
      state.highlightedMeshes = [];
    },
  },
});

export const {
  selectGeometry,
  clearSelection,
  addHighlightedMesh,
  removeHighlightedMesh,
  clearHighlights,
} = geometrySelectionSlice.actions;

export default geometrySelectionSlice.reducer;
