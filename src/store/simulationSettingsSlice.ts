import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SimulationSettingsState, SimulationSettingOption } from "@/types/simulationSettings";

const initialState: SimulationSettingsState = {
  options: [],
  values: {},
  loading: false,
  error: null,
  selectedMethodType: "DE",
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
  },
});

export const { setOptions, updateValue, resetValues, clearSettings, setSelectedMethodType } =
  simulationSettingsSlice.actions;

export const simulationSettingsReducer = simulationSettingsSlice.reducer;
