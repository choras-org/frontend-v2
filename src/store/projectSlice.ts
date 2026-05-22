import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Load groups from localStorage on initialization
const loadGroupsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem("projectGroups");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const projectSlice = createSlice({
  name: "project",
  initialState: {
    activeGroup: "ALL",
    groups: loadGroupsFromStorage(), // Store groups directly in Redux
  },
  reducers: {
    setActiveGroup: (state, action: PayloadAction<string>) => {
      state.activeGroup = action.payload;
    },
    addGroup: (state, action: PayloadAction<string>) => {
      // Add a single group if it doesn't exist
      if (!state.groups.includes(action.payload)) {
        state.groups.push(action.payload);
        state.groups.sort((a, b) => a.localeCompare(b));
        // Persist to localStorage
        localStorage.setItem("projectGroups", JSON.stringify(state.groups));
      }
    },
    syncGroupsFromProjects: (state, action: PayloadAction<string[]>) => {
      // Merge groups from projects with existing groups
      const merged = Array.from(new Set([...state.groups, ...action.payload]));
      merged.sort((a, b) => a.localeCompare(b));
      state.groups = merged;
      // Persist to localStorage
      localStorage.setItem("projectGroups", JSON.stringify(state.groups));
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((g) => g !== action.payload);
      // Persist to localStorage
      localStorage.setItem("projectGroups", JSON.stringify(state.groups));
    },
  },
});

export const { setActiveGroup, addGroup, syncGroupsFromProjects, removeGroup } =
  projectSlice.actions;

export const projectReducer = projectSlice.reducer;
