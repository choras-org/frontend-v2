import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Project, ProjectSimulation } from "@/types/project";

// Define a service using a base URL and expected endpoints
export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  // Define tag types for cache invalidation
  tagTypes: ["Projects"],

  endpoints: (build) => ({
    // Get all projects
    getProjects: build.query<Project[], void>({
      query: () => "/projects",

      // Provides a list of Projects-type tags for cache invalidation
      providesTags: [{ type: "Projects", id: "LIST" }],
    }),

    // Get a single project by ID
    getProject: build.query<Project, string>({
      query: (id) => `/projects/${id}`,

      // Provides a list of Projects-type tags for cache invalidation
      providesTags: (_, __, id) => [{ type: "Projects", id }],
    }),

    // Create a new project
    createProject: build.mutation<Project, Partial<Project>>({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),

      // Invalidates all Project-type queries providing the `LIST` id - after all, depending of the sort order,
      // that newly created project could show up in any lists.
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),

    // Update a project
    updateProject: build.mutation<Project, Partial<Project> & Pick<Project, "id">>({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),

      // Invalidates the specific Project-type query with the given id
      invalidatesTags: (_, __, { id }) => [
        { type: "Projects", id: "LIST" },
        { type: "Projects", id },
      ],
    }),

    // Delete a project
    deleteProject: build.mutation<Project, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),

      // Invalidates all Project-type queries providing the `LIST` id - after all, depending of the sort order,
      // that newly created project could show up in any lists.
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),

    deleteProjectsByGroup: build.mutation<void, string>({
      query: (group) => ({
        url: `/projects/deleteByGroup`,
        params: { group },
        method: "DELETE",
      }),

      // Invalidates all Project-type queries providing the `LIST` id - after all, depending of the sort order,
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),

    updateProjectsByGroup: build.mutation<void, { group: string; newGroup: string }>({
      query: ({ group, newGroup }) => ({
        url: `/projects/updateByGroup`,
        params: { group },
        body: { newGroup },
        method: "PATCH",
      }),

      // Invalidates all Project-type queries providing the `LIST` id - after all, depending of the sort order,
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),

    // Get all simulation runs
    getProjectsSimulations: build.query<ProjectSimulation[], void>({
      query: () => `/projects/simulations`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectsByGroupMutation,
  useDeleteProjectsByGroupMutation,
  useGetProjectsSimulationsQuery,
} = projectApi;
