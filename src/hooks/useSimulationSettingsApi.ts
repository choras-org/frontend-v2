import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useGetSimulationByIdQuery, useUpdateSimulationMutation } from "@/store/simulationApi";
import { toast } from "sonner";
import type { RootState } from "@/store";
import type { SimulationSettingsState } from "@/types/simulationSettings";

export function useSimulationSettingsApi() {
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const values = useSelector((state: RootState) => state.simulationSettings.values);

  const { data: simulation, error: simulationError } = useGetSimulationByIdQuery(
    activeSimulation?.id ?? 0,
    {
      skip: !activeSimulation?.id,
    },
  );

  const [updateSimulation] = useUpdateSimulationMutation();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>(null);

  const updateSimulationSettings = useCallback(
    async (settingsToSave?: SimulationSettingsState["values"], successMessage?: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!activeSimulation?.id) {
          console.warn("Cannot update simulation: No active simulation");
          toast.error("No active simulation to update");
          return;
        }

        if (!simulation) {
          console.warn("Cannot update simulation: Simulation data not loaded");
          toast.error("Simulation data not available");
          return;
        }

        if (!currentModelId) {
          console.warn("Cannot update simulation: No current model ID");
          toast.error("Model data not available");
          return;
        }

        const simulationSettings = settingsToSave || values;

        const updatePayload = {
          id: activeSimulation.id,
          body: {
            modelId: currentModelId,
            name: simulation.name,
            status: simulation.status,
            hasBeenEdited: true,
            solverSettings: {
              simulationSettings,
            },
          },
        };

        try {
          await updateSimulation(updatePayload).unwrap();
          toast.success(successMessage || "Settings saved");
        } catch (error) {
          console.error("Failed to update simulation:", error);
          toast.error("Failed to save settings");
        }
      }, 1000);
    },
    [activeSimulation?.id, simulation, currentModelId, values, updateSimulation],
  );

  return {
    simulation,
    simulationError,
    updateSimulationSettings,
  };
}
