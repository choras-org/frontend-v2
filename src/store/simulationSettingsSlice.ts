import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SimulationSettingsState, SimulationSettingOption } from "@/types/simulationSettings";

const initialState: SimulationSettingsState = {
  options: [],
  values: {},
  loading: false,
  error: null,
  selectedMethodType: "DE",
  selectedResourceType: "LOCAL",
  errors: {},
};

const simulationSettingsSlice = createSlice({
  name: "simulationSettings",
  initialState,
  reducers: {
    setOptions: (state, action: PayloadAction<SimulationSettingOption[]>) => {
      state.options = action.payload;
      state.values = {};
      action.payload.forEach((option) => {
        state.values[option.id] = option.default;
      });
    },
    updateValue: (state, action: PayloadAction<{ id: string; value: string | number }>) => {
      const { id, value } = action.payload;
      state.values[id] = value;
    },
    resetValues: (state) => {
      state.values = {};
      state.options.forEach((option) => {
        state.values[option.id] = option.default;
      });
    },
    clearSettings: (state) => {
      state.options = [];
      state.values = {};
      state.error = null;
    },
    setSelectedMethodType: (state, action: PayloadAction<string>) => {
      state.selectedMethodType = action.payload;
      state.options = [];
      state.values = {};
    },
    setSelectedResourceType: (state, action: PayloadAction<string>) => {
      state.selectedResourceType = action.payload;
    },
    setErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.errors = action.payload;
    },
    addError: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.errors[action.payload.id] = action.payload.name;
    },
    removeError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
  },
});

export const {
  setOptions,
  updateValue,
  resetValues,
  clearSettings,
  setSelectedMethodType,
  setSelectedResourceType,
  setErrors,
  addError,
  removeError,
} = simulationSettingsSlice.actions;

export const simulationSettingsReducer = simulationSettingsSlice.reducer;
