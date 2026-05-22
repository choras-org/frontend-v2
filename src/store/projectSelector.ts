import { createSelector } from "@reduxjs/toolkit/react";
import { projectApi } from "./projectApi";
import type { RootState } from "./index";
import type { GroupProject } from "@/types/project";

// Selector to get all model ids from a projectId
export const selectModelIdsByProjectId = createSelector(
  (projectId: number) => projectId,
  (projectId) => (state: RootState) => {
    // Try to get the project from the cache
    let project = projectApi.endpoints.getProject.select(projectId.toString())(state)?.data;
    if (!project) {
      // If not found, try to get it from the list of projects
      const projects = projectApi.endpoints.getProjects.select()(state)?.data;
      project = projects?.find((p) => p.id === projectId);
    }
    return project?.models?.map((model) => model.id) || [];
  },
);

// Selector to get the active group from the state
export const selectActiveGroup = (state: RootState) => state.project.activeGroup;

// Selector to get projects filtered by the active group
export const selectProjectsByActiveGroup = createSelector(
  (state: RootState) => state.project.activeGroup,
  (state: RootState) => state.project.groups,
  (state: RootState) => projectApi.endpoints.getProjects.select()(state)?.data,
  (activeGroup, storedGroups, projects) => {
    if (!projects) return [];

    // Use stored groups from Redux, or fall back to groups from projects
    const groups =
      storedGroups.length > 0 ? storedGroups : projects.filter((p) => p.group).map((p) => p.group);
    const uniqueGroups = Array.from(new Set([...groups, "NONE"])).sort((a, b) => {
      // Always put "NONE" at the bottom
      if (a === "NONE") return 1;
      if (b === "NONE") return -1;

      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });

    const results: GroupProject[] = uniqueGroups.map((group) => ({
      group: group,
      projects: projects.filter((project) =>
        group === "NONE" ? !project.group : project.group === group,
      ),
    }));

    // Return all groups if activeGroup is "ALL"
    if (activeGroup === "ALL") return results;

    // Otherwise, filter by the active group
    return results.filter((project) => project.group === activeGroup);
  },
);
