import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { setLoading, setError, storeRhinoFile, setCurrentModelId } from "@/store/modelSlice";
import { processModelFromUrl, optimizeModelForRendering } from "@/helpers/modelProcessor";

export function useModelLoader() {
  const dispatch = useDispatch();
  const { rhinoFiles, currentModelId, loading, error } = useSelector(
    (state: RootState) => state.model,
  );

  const loadModelFromUrl = useCallback(
    async (modelId: number, modelUrl: string) => {
      dispatch(setLoading(true));

      try {
        const rhinoFileData = await processModelFromUrl(modelId, modelUrl);

        const optimizedData = optimizeModelForRendering(rhinoFileData);

        dispatch(storeRhinoFile(optimizedData));
        dispatch(setCurrentModelId(modelId));

        return optimizedData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load model";
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [dispatch],
  );

  const setActiveModel = useCallback(
    (modelId: number | null) => {
      dispatch(setCurrentModelId(modelId));
    },
    [dispatch],
  );

  const getCurrentModel = useCallback(() => {
    if (currentModelId && rhinoFiles[currentModelId]) {
      return rhinoFiles[currentModelId];
    }
    return null;
  }, [currentModelId, rhinoFiles]);

  const isModelLoaded = useCallback(
    (modelId: number) => {
      return !!rhinoFiles[modelId];
    },
    [rhinoFiles],
  );

  const isLoading = useCallback(
    (modelId?: number) => {
      if (modelId) {
        return loading && !rhinoFiles[modelId];
      }
      return loading;
    },
    [loading, rhinoFiles],
  );

  return {
    rhinoFiles,
    currentModelId,
    loading,
    error,
    loadModelFromUrl,
    setActiveModel,
    getCurrentModel,
    isModelLoaded,
    isLoading,
  };
}
