import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Model, ModelDetail, ModelSimulationCompatibility } from "@/types/model";
import type { GeometryIssueInputs } from "@/store/geometryIssueSlice";

export const modelApi = createApi({
  reducerPath: "modelApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  tagTypes: ["Models"],

  endpoints: (build) => ({
    deleteModel: build.mutation<void, number>({
      query: (modelId) => ({
        url: `/models/${modelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [{ type: "Models", id: id }],
    }),

    updateModel: build.mutation<Model, Partial<Model>, Pick<Model, "id">>({
      query: ({ id, ...body }) => ({
        url: `/models/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, model) => [{ type: "Models", id: model.id }],
    }),

    getModel: build.query<ModelDetail, string>({
      query: (id) => `/models/${id}`,
      providesTags: (_, __, id) => [{ type: "Models", id }],
    }),

    fetchModelFile: build.query<ArrayBuffer, string>({
      query: (modelUrl) => ({
        url: modelUrl,
        responseHandler: (response) => response.arrayBuffer(),
      }),
      providesTags: (_, __, modelUrl) => [{ type: "Models", id: `file-${modelUrl}` }],
    }),

    fetchModelIssues: build.query<GeometryIssueInputs, string>({
      query: (fileUrl) => ({
        url: fileUrl,
      }),
      providesTags: (_, __, fileUrl) => [{ type: "Models", id: `issues-${fileUrl}` }],
    }),

    getModelSimulationCompatibility: build.query<ModelSimulationCompatibility, string | number>({
      query: (modelId) => `/models/${modelId}/simulation-compatibility`,
      providesTags: (_, __, modelId) => [{ type: "Models", id: `compatibility-${modelId}` }],
    }),

    setRepairDecision: build.mutation<
      ModelDetail,
      { modelId: string | number; decision: "accept" | "reject" }
    >({
      query: ({ modelId, decision }) => ({
        url: `/models/${modelId}/repair-decision`,
        method: "POST",
        body: { decision },
      }),
      invalidatesTags: (_, __, { modelId }) => [
        { type: "Models", id: modelId },
        { type: "Models", id: `compatibility-${modelId}` },
      ],
    }),
  }),
});

export const {
  useDeleteModelMutation,
  useGetModelQuery,
  useFetchModelFileQuery,
  useFetchModelIssuesQuery,
  useGetModelSimulationCompatibilityQuery,
  useSetRepairDecisionMutation,
  useUpdateModelMutation,
} = modelApi;
