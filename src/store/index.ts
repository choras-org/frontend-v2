import { configureStore } from "@reduxjs/toolkit";
import { projectApi } from "./projectApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import { simulationApi } from "./simulationApi";
import { projectReducer } from "./projectSlice";
import { simulationReducer } from "./simulationSlice";
import { modelApi } from "./modelApi";
import modelReducer from "./modelSlice";
import { auralizationApi } from "./auralizationApi";
import geometrySelectionReducer from "./geometrySelectionSlice";
import { materialsApi } from "./materialsApi";
import materialAssignmentReducer from "./materialAssignmentSlice";
import { sourceReceiverReducer } from "./sourceReceiverSlice";
import { simulationSettingsApi } from "./simulationSettingsApi";
import { simulationSettingsReducer } from "./simulationSettingsSlice";
import { tabReducer } from "./tabSlice";
import { userPreferencesApi } from "./userPreferenceApi";
import { materialCategoriesApi } from "./materialCategoryApi";

export const store = configureStore({
  reducer: {
    [projectApi.reducerPath]: projectApi.reducer,
    [simulationApi.reducerPath]: simulationApi.reducer,
    [modelApi.reducerPath]: modelApi.reducer,
    [materialsApi.reducerPath]: materialsApi.reducer,
    [simulationSettingsApi.reducerPath]: simulationSettingsApi.reducer,
    [auralizationApi.reducerPath]: auralizationApi.reducer,
    [userPreferencesApi.reducerPath]: userPreferencesApi.reducer,
    [materialCategoriesApi.reducerPath]: materialCategoriesApi.reducer,
    project: projectReducer,
    simulation: simulationReducer,
    model: modelReducer,
    geometrySelection: geometrySelectionReducer,
    materialAssignment: materialAssignmentReducer,
    sourceReceiver: sourceReceiverReducer,
    simulationSettings: simulationSettingsReducer,
    tab: tabReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["model/storeRhinoFile", "auralizationApi/executeQuery/fulfilled"],
        ignoredPaths: ["model.rhinoFiles", auralizationApi.reducerPath],
      },
    }).concat(
      projectApi.middleware,
      simulationApi.middleware,
      modelApi.middleware,
      materialsApi.middleware,
      simulationSettingsApi.middleware,
      auralizationApi.middleware,
      userPreferencesApi.middleware,
      materialCategoriesApi.middleware,
    ),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);
