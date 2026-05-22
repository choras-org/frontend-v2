import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SimulationSettingsResponse, SimulationMethod } from "@/types/simulationSettings";

export const simulationSettingsApi = createApi({
  reducerPath: "simulationSettingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
  }),
  tagTypes: ["SimulationSettings", "SimulationMethods"],
  endpoints: (builder) => ({
    getSimulationSettings: builder.query<SimulationSettingsResponse, string>({
      query: (simulationType) => `/simulation_settings/${simulationType}`,
      providesTags: ["SimulationSettings"],
    }),
    getSimulationMethods: builder.query<SimulationMethod[], void>({
      query: () => `/simulation_settings`,
      providesTags: ["SimulationMethods"],
    }),
  }),
});

export const { useGetSimulationSettingsQuery, useGetSimulationMethodsQuery } =
  simulationSettingsApi;
