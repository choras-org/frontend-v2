import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Material } from "@/types/material";

export const materialsApi = createApi({
  reducerPath: "materialsApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  tagTypes: ["Materials"],

  endpoints: (build) => ({
    getMaterials: build.query<Material[], void>({
      query: () => "/materials",
      providesTags: [{ type: "Materials", id: "LIST" }],
    }),
    createMaterial: build.mutation<Material, Omit<Material, "id" | "createdAt" | "updatedAt">>({
      query: (newMaterial) => ({
        url: "/materials",
        method: "POST",
        body: newMaterial,
      }),
      invalidatesTags: [{ type: "Materials", id: "LIST" }],
    }),
  }),
});

export const { useGetMaterialsQuery, useCreateMaterialMutation } = materialsApi;
