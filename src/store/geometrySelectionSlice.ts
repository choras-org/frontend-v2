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
  selectedGeometries: Record<string, SelectedGeometry>;
}

const initialState: GeometrySelectionState = {
  selectedGeometry: null,
  highlightedMeshes: [],
  selectedGeometries: {},
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

    addSelectedGeometry: (state, action: PayloadAction<SelectedGeometry>) => {
      const geometry = action.payload;
      if (geometry.materialId) {
        state.selectedGeometries[geometry.mesh.uuid] = geometry;
      }
    },

    removeSelectedGeometry: (state, action: PayloadAction<string>) => {
      const meshUuid = action.payload;
      delete state.selectedGeometries[meshUuid];
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
  addSelectedGeometry,
  removeSelectedGeometry,
} = geometrySelectionSlice.actions;

export default geometrySelectionSlice.reducer;
