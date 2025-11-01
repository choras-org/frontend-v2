import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
  useCreateSimulationMutation,
  useUpdateSimulationMutation,
  useLazyGetSimulationsByModelIdQuery,
} from "@/store/simulationApi";
import { toast } from "sonner";
import type { Simulation } from "@/types/simulation";

export function useDuplicateSimulation() {
  const navigate = useNavigate();
  const [createSimulation] = useCreateSimulationMutation();
  const [updateSimulation] = useUpdateSimulationMutation();
  const [getSimulationsByModelId] = useLazyGetSimulationsByModelIdQuery();

  const duplicateSimulation = useCallback(
    async (
      currentSimulation: Simulation,
      allSimulations: Simulation[],
      options?: {
        navigateToNew?: boolean;
        successMessage?: string;
      },
    ) => {
      const { navigateToNew = true, successMessage = "Simulation duplicated successfully" } =
        options || {};

      try {
        const baseName = currentSimulation.name;
        let duplicateName = `${baseName} (1)`;
        let counter = 1;

        while (allSimulations.some((sim) => sim.name === duplicateName)) {
          counter++;
          duplicateName = `${baseName} (${counter})`;
        }

        const newSimulation = await createSimulation({
          name: duplicateName,
          description: currentSimulation.description,
          modelId: currentSimulation.modelId,
          layerIdByMaterialId: currentSimulation.layerIdByMaterialId,
          solverSettings: currentSimulation.solverSettings,
          taskType: currentSimulation.taskType,
        }).unwrap();

        await updateSimulation({
          id: newSimulation.id,
          body: {
            name: duplicateName,
            description: currentSimulation.description,
            modelId: currentSimulation.modelId,
            status: "Created", // Reset status for new simulation
            layerIdByMaterialId: currentSimulation.layerIdByMaterialId,
            solverSettings: currentSimulation.solverSettings,
            sources: currentSimulation.sources,
            receivers: currentSimulation.receivers,
            taskType: currentSimulation.taskType,
          },
        }).unwrap();

        await getSimulationsByModelId(currentSimulation.modelId).unwrap();

        if (navigateToNew) {
          navigate(`/editor/${currentSimulation.modelId}/${newSimulation.id}`);
        }

        toast.success(successMessage);

        return newSimulation;
      } catch (error) {
        console.error("Failed to duplicate simulation:", error);
        toast.error("Failed to duplicate simulation");
        throw error;
      }
    },
    [createSimulation, updateSimulation, getSimulationsByModelId, navigate],
  );

  return { duplicateSimulation };
}
