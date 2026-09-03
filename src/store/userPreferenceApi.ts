import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { UserPreference } from "@/types/userPreference";

export const userPreferencesApi = createApi({
  reducerPath: "userPreferencesApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),

  tagTypes: ["UserPreferences"],

  endpoints: (build) => ({
    getUserPreferences: build.query<UserPreference[], void>({
      query: () => "/user-preferences",
      providesTags: [{ type: "UserPreferences", id: "LIST" }],
    }),
    updateUserPreference: build.mutation<
      UserPreference,
      Omit<UserPreference, "createdAt" | "updatedAt">
    >({
      query: ({ id, ...body }) => ({
        url: `/user-preferences/${id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "UserPreferences", id: "LIST" },
        { type: "UserPreferences", id },
      ],
    }),
  }),
});

export const { useGetUserPreferencesQuery, useUpdateUserPreferenceMutation } = userPreferencesApi;
