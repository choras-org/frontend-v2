import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RhinoFileData, LayerState } from "@/types/layer";

const initialState: LayerState = {
  rhinoFiles: {},
  currentModelId: null,
  loading: false,
  error: null,
};

export const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setCurrentModelId: (state, action: PayloadAction<number | null>) => {
      state.currentModelId = action.payload;
    },

    storeRhinoFile: (state, action: PayloadAction<RhinoFileData>) => {
      const rhinoFile = action.payload;
      state.rhinoFiles[rhinoFile.modelId] = rhinoFile;
      state.loading = false;
      state.error = null;
    },

    updateLayerVisibility: (
      state,
      action: PayloadAction<{ modelId: number; layerId: string; visible: boolean }>,
    ) => {
      const { modelId, layerId, visible } = action.payload;
      const rhinoFile = state.rhinoFiles[modelId];
      if (rhinoFile) {
        const layer = rhinoFile.layers.find((l) => l.id === layerId);
        if (layer) {
          layer.visible = visible;
        }
      }
    },

    clearRhinoFile: (state, action: PayloadAction<number>) => {
      delete state.rhinoFiles[action.payload];
      if (state.currentModelId === action.payload) {
        state.currentModelId = null;
      }
    },

    clearAllRhinoFiles: (state) => {
      state.rhinoFiles = {};
      state.currentModelId = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setCurrentModelId,
  storeRhinoFile,
  updateLayerVisibility,
  clearRhinoFile,
  clearAllRhinoFiles,
} = modelSlice.actions;

export default modelSlice.reducer;
