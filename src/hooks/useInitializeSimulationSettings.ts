import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { simulationSettingsApi } from "@/store/simulationSettingsApi";
import { useUpdateSimulationMutation } from "@/store/simulationApi";
import { setOptions } from "@/store/simulationSettingsSlice";
import { toast } from "sonner";
import type { Simulation } from "@/types/simulation";
import type { AppDispatch } from "@/store";

export function useInitializeSimulationSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const [updateSimulation] = useUpdateSimulationMutation();

  const initializeSettings = useCallback(
    async (simulation: Simulation, methodType?: string) => {
      try {
        const settingsData = await dispatch(
          simulationSettingsApi.endpoints.getSimulationSettings.initiate(
            methodType || simulation.taskType || "DE",
          ),
        ).unwrap();

        if (!settingsData?.options) {
          console.warn("Cannot initialize settings: Settings data not available");
          toast.error("Settings data not available");
          return false;
        }

        dispatch(setOptions(settingsData.options));

        const defaultValues: Record<string, string | number> = {};
        settingsData.options.forEach((option) => {
          defaultValues[option.id] = option.default;
        });

        const updatePayload = {
          id: simulation.id,
          body: {
            modelId: simulation.modelId,
            name: simulation.name,
            status: simulation.status,
            hasBeenEdited: simulation.hasBeenEdited || false,
            solverSettings: {
              simulationSettings: defaultValues,
            },
          },
        };

        await updateSimulation(updatePayload).unwrap();

        return true;
      } catch (error) {
        console.error("Failed to initialize simulation settings:", error);
        toast.error("Failed to initialize settings");
        return false;
      }
    },
    [dispatch, updateSimulation],
  );

  return { initializeSettings };
}
