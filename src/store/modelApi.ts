import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Model, ModelDetail } from "@/types/model";

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
  }),
});

export const {
  useDeleteModelMutation,
  useGetModelQuery,
  useFetchModelFileQuery,
  useUpdateModelMutation,
} = modelApi;
