import type { Auralization } from "@/types/auralization";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const auralizationApi = createApi({
  reducerPath: "auralizationApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  // Define tag types for cache invalidation
  tagTypes: ["Auralizations", "ImpulseResponses"],

  endpoints: (build) => ({
    // Get Impulse Response by simulation ID
    getImpulseResponseBySimulationId: build.query<string, number>({
      query: (simulationId) => ({
        url: `/auralizations/${simulationId}/impulse/wav`,
        responseHandler: (response) => response.arrayBuffer(),
      }),
      providesTags: (_, __, simulationId) => [{ type: "ImpulseResponses", id: simulationId }],
    }),

    // Get audiofiles
    getAuralizationsBySimulationId: build.query<Auralization[], number>({
      query: (simulationId) => ({
        url: `/auralizations/${simulationId}/audiofiles`,
      }),
      providesTags: (_, __, simulationId) => [{ type: "Auralizations", id: simulationId }],
    }),

    // Post upload audiofile
    uploadAudioFile: build.mutation<void, FormData>({
      query: (formData) => ({
        url: `/auralizations/upload/audiofile`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_, __, formData) => {
        console.log(formData.get("simulation_id"));

        return [{ type: "Auralizations", id: formData.get("simulation_id") as string }];
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetImpulseResponseBySimulationIdQuery,
  useGetAuralizationsBySimulationIdQuery,
  useLazyGetImpulseResponseBySimulationIdQuery,
  useUploadAudioFileMutation,
} = auralizationApi;
