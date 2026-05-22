import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Source, Receiver } from "@/types/simulation";
import { useGetSimulationByIdQuery, useUpdateSimulationMutation } from "@/store/simulationApi";
import { toast } from "sonner";

export function useSourceReceiverApi() {
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const sources = useSelector((state: RootState) => state.sourceReceiver.sources);
  const receivers = useSelector((state: RootState) => state.sourceReceiver.receivers);

  const { data: simulation, error: simulationError } = useGetSimulationByIdQuery(
    activeSimulation?.id ?? 0,
    {
      skip: !activeSimulation?.id,
    },
  );
  const [updateSimulation] = useUpdateSimulationMutation();

  const sourcesDebounceTimeoutRef = useRef<NodeJS.Timeout>(null);
  const receiversDebounceTimeoutRef = useRef<NodeJS.Timeout>(null);

  const updateSimulationData = useCallback(
    async (sourcesToSave?: Source[]) => {
      if (sourcesDebounceTimeoutRef.current) {
        clearTimeout(sourcesDebounceTimeoutRef.current);
      }

      sourcesDebounceTimeoutRef.current = setTimeout(async () => {
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

        const sourcesData = sourcesToSave || sources;

        const updatePayload = {
          id: activeSimulation.id,
          body: {
            modelId: currentModelId,
            name: simulation.name,
            status: simulation.status,
            hasBeenEdited: true,
            sources: sourcesData,
          },
        };

        try {
          await updateSimulation(updatePayload).unwrap();
          toast.success("Sources saved");
        } catch (error) {
          console.error("Failed to update simulation:", error);
          toast.error("Failed to save sources");
        }
      }, 500);
    },
    [activeSimulation?.id, simulation, currentModelId, sources, updateSimulation],
  );

  const updateReceiversData = useCallback(
    async (receiversToSave?: Receiver[]) => {
      if (receiversDebounceTimeoutRef.current) {
        clearTimeout(receiversDebounceTimeoutRef.current);
      }

      receiversDebounceTimeoutRef.current = setTimeout(async () => {
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

        const receiversData = receiversToSave || receivers;

        const updatePayload = {
          id: activeSimulation.id,
          body: {
            modelId: currentModelId,
            name: simulation.name,
            status: simulation.status,
            hasBeenEdited: true,
            receivers: receiversData,
          },
        };

        try {
          await updateSimulation(updatePayload).unwrap();
          toast.success("Receivers saved");
        } catch (error) {
          console.error("Failed to update simulation:", error);
          toast.error("Failed to save receivers");
        }
      }, 500);
    },
    [activeSimulation?.id, simulation, currentModelId, receivers, updateSimulation],
  );

  return {
    simulation,
    simulationError,
    updateSimulationData,
    updateReceiversData,
  };
}
