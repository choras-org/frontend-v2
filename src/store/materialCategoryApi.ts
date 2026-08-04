import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MaterialCategory } from "@/types/materialCategory";

export const materialCategoriesApi = createApi({
  reducerPath: "materialCategoriesApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  tagTypes: ["MaterialCategories"],

  endpoints: (build) => ({
    getMaterialCategories: build.query<MaterialCategory[], void>({
      query: () => "/material-categories",
      providesTags: [{ type: "MaterialCategories", id: "LIST" }],
    }),
    createMaterialCategory: build.mutation<
      MaterialCategory,
      Omit<MaterialCategory, "id" | "createdAt" | "updatedAt">
    >({
      query: (newMaterialCategory) => ({
        url: "/material-categories",
        method: "POST",
        body: newMaterialCategory,
      }),
      invalidatesTags: [{ type: "MaterialCategories", id: "LIST" }],
    }),
    updateMaterialCategory: build.mutation<
      MaterialCategory,
      Omit<MaterialCategory, "createdAt" | "updatedAt">
    >({
      query: ({ id, ...body }) => ({
        url: `/material-categories/${id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "MaterialCategories", id: "LIST" },
        { type: "MaterialCategories", id },
      ],
    }),
  }),
});

export const {
  useCreateMaterialCategoryMutation,
  useGetMaterialCategoriesQuery,
  useUpdateMaterialCategoryMutation,
} = materialCategoriesApi;
