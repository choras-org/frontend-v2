import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type TabValue = "sources" | "surfaces" | "settings";

interface TabState {
  activeTab: TabValue;
  highlightedElement: string | null;
}

const initialState: TabState = {
  activeTab: "sources",
  highlightedElement: null,
};

const tabSlice = createSlice({
  name: "tab",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabValue>) => {
      state.activeTab = action.payload;
    },
    setHighlightedElement: (state, action: PayloadAction<string | null>) => {
      state.highlightedElement = action.payload;
    },
    navigateToTabAndHighlight: (
      state,
      action: PayloadAction<{ tab: TabValue; element?: string }>,
    ) => {
      state.activeTab = action.payload.tab;
      state.highlightedElement = action.payload.element || null;
    },
  },
});

export const { setActiveTab, setHighlightedElement, navigateToTabAndHighlight } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
