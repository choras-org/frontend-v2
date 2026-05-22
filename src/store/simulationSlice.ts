import type { Simulation } from "@/types/simulation";
import { createSlice } from "@reduxjs/toolkit";

type SimulationState = {
  activeSimulation: Simulation | null;
  shouldAutoRun: boolean;
  compareResults: {
    id: string;
    modelId: number;
    simulationId: number | null;
    sourceId: string | null;
    receiverId: string | null;
    color: string;
  }[];
};

const simulationSlice = createSlice({
  name: "simulation",
  initialState: {
    activeSimulation: null,
    shouldAutoRun: false,
    compareResults: [],
  } as SimulationState,
  reducers: {
    setActiveSimulation: (state, action) => {
      state.activeSimulation = action.payload;
    },
    setShouldAutoRun: (state, action) => {
      state.shouldAutoRun = action.payload;
    },
    addCompareResult: (state, action) => {
      state.compareResults.push(action.payload);
    },
    removeCompareResult: (state, action) => {
      state.compareResults = state.compareResults.filter((result) => result.id !== action.payload);
    },
    updateCompareResult: (state, action) => {
      const { id, field, value } = action.payload;
      const index = state.compareResults.findIndex((r) => r.id === id);
      if (index !== -1) {
        state.compareResults[index] = {
          ...state.compareResults[index],
          [field]: value,
        };
      }
    },
    initializeCompareResults: (state, action) => {
      state.compareResults = action.payload;
    },
    clearCompareResults: (state) => {
      state.compareResults = [];
    },
  },
});

export const {
  setActiveSimulation,
  setShouldAutoRun,
  addCompareResult,
  removeCompareResult,
  updateCompareResult,
  initializeCompareResults,
  clearCompareResults,
} = simulationSlice.actions;

export const simulationReducer = simulationSlice.reducer;
