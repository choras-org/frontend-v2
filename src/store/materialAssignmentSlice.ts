import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface MaterialAssignmentState {
  assignments: Record<string, number>;
}

const initialState: MaterialAssignmentState = {
  assignments: {},
};

export const materialAssignmentSlice = createSlice({
  name: "materialAssignment",
  initialState,
  reducers: {
    assignMaterial: (state, action: PayloadAction<{ meshId: string; materialId: number }>) => {
      const { meshId, materialId } = action.payload;
      state.assignments[meshId] = materialId;
    },

    removeMaterialAssignment: (state, action: PayloadAction<string>) => {
      const meshId = action.payload;
      delete state.assignments[meshId];
    },

    clearAllAssignments: (state) => {
      state.assignments = {};
    },

    setAssignments: (state, action: PayloadAction<Record<string, number>>) => {
      state.assignments = action.payload;
    },
  },
});

export const { assignMaterial, removeMaterialAssignment, clearAllAssignments, setAssignments } =
  materialAssignmentSlice.actions;

export default materialAssignmentSlice.reducer;
