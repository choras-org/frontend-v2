import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SimulationResult, Simulation, SimulationRun } from "@/types/simulation";

export const simulationApi = createApi({
  reducerPath: "simulationApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  // Define tag types for cache invalidation
  tagTypes: ["Simulations", "SimulationsByModel", "SimulationResults"],

  endpoints: (build) => ({
    getSimulationsByModelId: build.query<Simulation[], number>({
      query: (modelId) => `/simulations?modelId=${modelId}`,

      providesTags: (_, __, arg) => [{ type: "SimulationsByModel", id: arg }],
    }),

    createSimulation: build.mutation<Simulation, Partial<Simulation>>({
      query: (body) => ({
        url: "/simulations",
        method: "POST",
        body,
      }),

      invalidatesTags: (_, __, arg) => [{ type: "SimulationsByModel", id: arg.modelId }],
    }),

    getSimulationResult: build.query<SimulationResult[], number>({
      query: (simulationId) => `/simulations/${simulationId}/result`,
      providesTags: (_, __, arg) => [{ type: "SimulationResults", id: arg }],
    }),

    // Get simulation by ID
    getSimulationById: build.query<Simulation, number>({
      query: (simulationId) => `/simulations/${simulationId}`,

      providesTags: (_, __, arg) => [{ type: "Simulations", id: arg }],
    }),

    updateSimulation: build.mutation<Simulation, { id: number; body: Partial<Simulation> }>({
      query: ({ id, body }) => ({
        url: `/simulations/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (_, __, arg) => [
        { type: "Simulations", id: arg.id },
        { type: "SimulationsByModel", id: arg.body.modelId },
      ],
    }),

    deleteSimulation: build.mutation<void, { id: number; modelId: number }>({
      query: ({ id }) => ({
        url: `/simulations/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (_, __, arg) => [{ type: "SimulationsByModel", id: arg.modelId }],
    }),

    runSimulation: build.mutation<void, { simulationId: number }>({
      query: ({ simulationId }) => ({
        url: "/simulations/run",
        method: "POST",
        body: { simulationId },
      }),

      invalidatesTags: (_, __, arg) => [{ type: "Simulations", id: arg.simulationId }],
    }),

    getSimulationRuns: build.query<SimulationRun[], void>({
      query: () => "/simulations/run",
      keepUnusedDataFor: 0,
    }),

    cancelSimulation: build.mutation<void, { simulationId: number }>({
      query: ({ simulationId }) => ({
        url: "/simulations/cancel",
        method: "POST",
        body: { simulationId },
      }),

      invalidatesTags: (_, __, arg) => [{ type: "Simulations", id: arg.simulationId }],
    }),

    patchMeshes: build.mutation<void, { modelId: number }>({
      query: ({ modelId }) => ({
        url: `/meshes?modelId=${modelId}`,
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useGetSimulationsByModelIdQuery,
  useLazyGetSimulationsByModelIdQuery,
  useCreateSimulationMutation,
  useGetSimulationByIdQuery,
  useUpdateSimulationMutation,
  useDeleteSimulationMutation,
  useGetSimulationResultQuery,
  useLazyGetSimulationResultQuery,
  useRunSimulationMutation,
  useGetSimulationRunsQuery,
  useLazyGetSimulationRunsQuery,
  useCancelSimulationMutation,
  usePatchMeshesMutation,
} = simulationApi;
