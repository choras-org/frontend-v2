import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Source, Receiver } from "@/types/simulation";

interface SourceReceiverState {
  sources: Source[];
  receivers: Receiver[];
  selectedSource: string | null;
  selectedReceiver: string | null;
  isTransforming: boolean;
}

const initialState: SourceReceiverState = {
  sources: [],
  receivers: [],
  selectedSource: null,
  selectedReceiver: null,
  isTransforming: false,
};

const sourceReceiverSlice = createSlice({
  name: "sourceReceiver",
  initialState,
  reducers: {
    addSource: (state, action: PayloadAction<Source>) => {
      if (state.sources.length < 1) {
        state.sources.push(action.payload);
      }
    },
    removeSource: (state, action: PayloadAction<string>) => {
      state.sources = state.sources.filter((source) => source.id !== action.payload);
    },
    removeAllSources: (state) => {
      state.sources = [];
    },
    updateSource: (
      state,
      action: PayloadAction<{ id: string; field: "x" | "y" | "z"; value: number }>,
    ) => {
      const { id, field, value } = action.payload;
      const source = state.sources.find((source) => source.id === id);
      if (source) {
        source[field] = value;
      }
    },
    addReceiver: (state, action: PayloadAction<Receiver>) => {
      if (state.receivers.length < 1) {
        state.receivers.push(action.payload);
      }
    },
    removeReceiver: (state, action: PayloadAction<string>) => {
      state.receivers = state.receivers.filter((receiver) => receiver.id !== action.payload);
    },
    removeAllReceivers: (state) => {
      state.receivers = [];
    },
    updateReceiver: (
      state,
      action: PayloadAction<{ id: string; field: "x" | "y" | "z"; value: number }>,
    ) => {
      const { id, field, value } = action.payload;
      const receiver = state.receivers.find((receiver) => receiver.id === id);
      if (receiver) {
        receiver[field] = value;
      }
    },
    updateReceiverValidation: (
      state,
      action: PayloadAction<{ id: string; isValid: boolean; validationError?: string }>,
    ) => {
      const { id, isValid, validationError } = action.payload;
      const receiver = state.receivers.find((receiver) => receiver.id === id);
      if (receiver) {
        receiver.isValid = isValid;
        receiver.validationError = validationError;
      }
    },
    updateSourceValidation: (
      state,
      action: PayloadAction<{ id: string; isValid: boolean; validationError?: string }>,
    ) => {
      const { id, isValid, validationError } = action.payload;
      const source = state.sources.find((source) => source.id === id);
      if (source) {
        source.isValid = isValid;
        source.validationError = validationError;
      }
    },
    selectSource: (state, action: PayloadAction<string | null>) => {
      state.selectedSource = action.payload;
    },
    selectReceiver: (state, action: PayloadAction<string | null>) => {
      state.selectedReceiver = action.payload;
    },
    setSources: (state, action: PayloadAction<Source[]>) => {
      state.sources = action.payload;
    },
    setReceivers: (state, action: PayloadAction<Receiver[]>) => {
      state.receivers = action.payload;
    },
    setIsTransforming: (state, action: PayloadAction<boolean>) => {
      state.isTransforming = action.payload;
    },
  },
});

export const {
  addSource,
  removeSource,
  removeAllSources,
  updateSource,
  updateSourceValidation,
  addReceiver,
  removeReceiver,
  removeAllReceivers,
  updateReceiver,
  updateReceiverValidation,
  selectSource,
  selectReceiver,
  setSources,
  setReceivers,
  setIsTransforming,
} = sourceReceiverSlice.actions;

export const sourceReceiverReducer = sourceReceiverSlice.reducer;
