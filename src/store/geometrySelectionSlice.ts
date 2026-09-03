import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type * as THREE from "three";

/**
 * Public, mesh-based geometry shape used by components and the
 * `useGeometrySelection` hook API. Meshes are resolved from the mesh registry;
 * they are never stored in Redux.
 */
export interface SelectedGeometry {
  mesh: THREE.Mesh;
  faceIndex: number;
  point: THREE.Vector3;
  materialId?: string;
}

/** Serializable form actually stored in Redux state. */
export interface SerializableGeometry {
  meshUuid: string;
  faceIndex: number;
  point: { x: number; y: number; z: number };
  materialId?: string;
}

interface GeometrySelectionState {
  selectedGeometry: SerializableGeometry | null;
  highlightedMeshUuids: string[];
  selectedGeometries: Record<string, SerializableGeometry>;
}

const initialState: GeometrySelectionState = {
  selectedGeometry: null,
  highlightedMeshUuids: [],
  selectedGeometries: {},
};

export const geometrySelectionSlice = createSlice({
  name: "geometrySelection",
  initialState,
  reducers: {
    selectGeometry: (state, action: PayloadAction<SerializableGeometry | null>) => {
      state.selectedGeometry = action.payload;
    },

    clearSelection: (state) => {
      state.selectedGeometry = null;
      state.selectedGeometries = {};
    },

    addHighlightedMesh: (state, action: PayloadAction<string>) => {
      const uuid = action.payload;
      if (!state.highlightedMeshUuids.includes(uuid)) {
        state.highlightedMeshUuids.push(uuid);
      }
    },

    addHighlightedMeshes: (state, action: PayloadAction<string[]>) => {
      const existing = new Set(state.highlightedMeshUuids);
      action.payload.forEach((uuid) => {
        if (!existing.has(uuid)) {
          existing.add(uuid);
          state.highlightedMeshUuids.push(uuid);
        }
      });
    },

    removeHighlightedMesh: (state, action: PayloadAction<string>) => {
      const uuid = action.payload;
      state.highlightedMeshUuids = state.highlightedMeshUuids.filter((id) => id !== uuid);
    },

    removeHighlightedMeshes: (state, action: PayloadAction<string[]>) => {
      const uuidsToRemove = new Set(action.payload);
      state.highlightedMeshUuids = state.highlightedMeshUuids.filter(
        (uuid) => !uuidsToRemove.has(uuid),
      );
    },

    addSelectedGeometry: (state, action: PayloadAction<SerializableGeometry>) => {
      const geometry = action.payload;
      if (geometry.materialId) {
        state.selectedGeometries[geometry.meshUuid] = geometry;
      }
    },

    addSelectedGeometries: (state, action: PayloadAction<SerializableGeometry[]>) => {
      action.payload.forEach((geometry) => {
        if (geometry.materialId) {
          state.selectedGeometries[geometry.meshUuid] = geometry;
        }
      });
    },

    removeSelectedGeometry: (state, action: PayloadAction<string>) => {
      const meshUuid = action.payload;
      delete state.selectedGeometries[meshUuid];
    },

    removeSelectedGeometries: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((meshUuid) => {
        delete state.selectedGeometries[meshUuid];
      });
    },

    clearSelectedGeometries: (state) => {
      state.selectedGeometries = {};
    },

    clearHighlights: (state) => {
      state.highlightedMeshUuids = [];
    },
  },
});

export const {
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
  clearSelectedGeometries,
} = geometrySelectionSlice.actions;

export default geometrySelectionSlice.reducer;
