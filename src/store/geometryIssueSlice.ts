import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type GeometryIssueCategory = string;
export type GeometryIssueType = "vertex" | "edge" | "face";

export type GeometryIssueElements = {
  type: GeometryIssueType;
  points: number[] | number[][];
};

export type GeometryIssue = {
  id?: string;
  type: GeometryIssueType;
  points: number[][];
  label?: string;
  message?: string;
};

export type GeometryIssueInput = {
  id: string;
  elements: GeometryIssueElements[];
  label?: string;
  message?: string;
};

export type GeometryIssues = Record<GeometryIssueCategory, GeometryIssue[]>;
export type GeometryIssueInputs = Record<GeometryIssueCategory, GeometryIssueInput[]>;

type GeometryIssuesState = {
  selectedIssue: GeometryIssue | null;
  geometryIssues: GeometryIssues | null;
  remainingIssues: GeometryIssues | null;
  expandedIssueGroups: Record<string, boolean>;
};

const initialState: GeometryIssuesState = {
  selectedIssue: null,
  geometryIssues: null,
  remainingIssues: null,
  expandedIssueGroups: {},
};

const normalizePoints = (points: number[] | number[][]) => {
  return Array.isArray(points[0]) ? (points as number[][]) : [points as number[]];
};

const normalizeIssue = (
  issue: GeometryIssueElements,
  label?: string,
  message?: string,
  id?: string,
): GeometryIssue => {
  return {
    id,
    type: issue.type,
    points: normalizePoints(issue.points),
    label,
    message,
  };
};

const normalizeIssueGroup = (issue: GeometryIssue | GeometryIssueInput): GeometryIssue[] => {
  if ("elements" in issue) {
    return issue.elements.map((element) =>
      normalizeIssue(element, issue.label, issue.message, issue.id),
    );
  }

  return [issue];
};

export const flattenIssuePoints = (
  issue: GeometryIssue | GeometryIssueInput | null | undefined,
): number[][] => {
  if (!issue) return [];

  if ("elements" in issue) {
    return issue.elements.flatMap((element) => normalizePoints(element.points));
  }

  return issue.points;
};

const pointKey = (point: number[]): string =>
  point.map((value) => Number(value).toFixed(6)).join(",");

// Two issues refer to the same geometry when their ids match, OR — because the
// pipeline assigns per-report ids that are NOT stable across the initial and
// repaired reports for some kinds (e.g. small_face, overlapping_face) — when
// every point of the candidate is part of the selected issue's points. The
// geometry fallback is what keeps highlighting in sync across the two pages.
export const issuesMatch = (
  selected: GeometryIssue | null | undefined,
  candidate: GeometryIssue | null | undefined,
): boolean => {
  if (!selected || !candidate) return false;
  if (selected.id && candidate.id && selected.id === candidate.id) return true;
  if (selected.type !== candidate.type) return false;

  const candidatePoints = candidate.points ?? [];
  if (candidatePoints.length === 0) return false;

  const selectedPointKeys = new Set((selected.points ?? []).map(pointKey));
  return candidatePoints.every((point) => selectedPointKeys.has(pointKey(point)));
};

const geometryIssueSlice = createSlice({
  name: "tab",
  initialState,
  reducers: {
    clearSelectedIssue: (state) => {
      state.selectedIssue = null;
    },
    setSelectedIssue: (state, action: PayloadAction<GeometryIssue | GeometryIssueInput>) => {
      if ("elements" in action.payload) {
        const firstElement = action.payload.elements[0];
        state.selectedIssue = firstElement
          ? normalizeIssue(
              firstElement,
              action.payload.label,
              action.payload.message,
              action.payload.id,
            )
          : null;
        return;
      }

      state.selectedIssue = action.payload;
    },
    setGeometryIssues: (state, action: PayloadAction<GeometryIssues | GeometryIssueInputs>) => {
      const categoryEntries = Object.entries(action.payload);

      state.selectedIssue = null;

      state.geometryIssues = categoryEntries.reduce((acc, [category, issues]) => {
        acc[category as GeometryIssueCategory] = issues.flatMap(normalizeIssueGroup);
        return acc;
      }, {} as GeometryIssues);

      state.expandedIssueGroups = categoryEntries.reduce(
        (acc, [category], index) => {
          acc[category] = index === 0;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    },
    setRemainingIssues: (state, action: PayloadAction<GeometryIssues | GeometryIssueInputs>) => {
      const categoryEntries = Object.entries(action.payload);

      state.remainingIssues = categoryEntries.reduce((acc, [category, issues]) => {
        acc[category as GeometryIssueCategory] = issues.flatMap(normalizeIssueGroup);
        return acc;
      }, {} as GeometryIssues);
    },
    setIssueGroupExpanded: (
      state,
      action: PayloadAction<{ groupKey: string; isExpanded: boolean }>,
    ) => {
      state.expandedIssueGroups[action.payload.groupKey] = action.payload.isExpanded;
    },
    clearGeometryIssues: (state) => {
      state.geometryIssues = null;
    },
    clearRemainingIssues: (state) => {
      state.remainingIssues = null;
    },
  },
});

export const {
  clearSelectedIssue,
  setGeometryIssues,
  setRemainingIssues,
  setIssueGroupExpanded,
  setSelectedIssue,
  clearRemainingIssues,
  clearGeometryIssues,
} = geometryIssueSlice.actions;
export const geometryIssueReducer = geometryIssueSlice.reducer;
