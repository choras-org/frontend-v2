import { useCallback, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useRunSimulationMutation,
  useGetSimulationRunsQuery,
  useCancelSimulationMutation,
  usePatchMeshesMutation,
  useLazyGetSimulationResultQuery,
  useLazyGetSimulationsByModelIdQuery,
} from "@/store/simulationApi";
import { toast } from "sonner";
import type { RootState } from "@/store";
import { useLazyGetImpulseResponseBySimulationIdQuery } from "@/store/auralizationApi";
import { useSimulationRunnerContext } from "@/contexts/SimulationRunnerContext";

export function useSimulationRunner() {
  const { isRunning, setIsRunning, progress, setProgress } = useSimulationRunnerContext();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasCheckedForRunningSimulation = useRef(false);
  const lastCheckedSimulationId = useRef<number | null>(null);

  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);

  const [runSimulation] = useRunSimulationMutation();
  const { data: simulationRuns, refetch: refetchSimulationRuns } = useGetSimulationRunsQuery();
  const [cancelSimulation] = useCancelSimulationMutation();
  const [patchMeshes] = usePatchMeshesMutation();
  const [getSimulationResult] = useLazyGetSimulationResultQuery();
  const [getSimulationsByModelId] = useLazyGetSimulationsByModelIdQuery();
  const [getImpulseResponseBySimulationId] = useLazyGetImpulseResponseBySimulationIdQuery();

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const cancelAndStop = useCallback(async () => {
    if (!activeSimulation?.id) {
      return;
    }

    try {
      await cancelSimulation({ simulationId: activeSimulation.id }).unwrap();
      toast.success("Simulation cancelled");
    } catch (error) {
      console.error("Failed to cancel simulation:", error);
      toast.error("Failed to cancel simulation");
    }

    setIsRunning(false);
    setProgress(0);
    stopPolling();
  }, [activeSimulation?.id, cancelSimulation, stopPolling]);

  const pollProgress = useCallback(async () => {
    if (!activeSimulation?.id) return;

    try {
      const { data } = await refetchSimulationRuns();

      if (data) {
        const currentRun = data.find((run) => run.simulation.id === activeSimulation.id);

        if (currentRun) {
          if (currentRun.status !== "Completed" && currentRun.percentage < 100) {
            setProgress(currentRun.percentage);
          }

          if (currentRun.status === "Completed" && currentRun.percentage === 100) {
            setIsRunning(false);
            stopPolling();
            toast.success("Simulation completed successfully!");
            getSimulationResult(activeSimulation.id);
            getSimulationsByModelId(activeSimulation.modelId);
            getImpulseResponseBySimulationId(activeSimulation.id);
            setProgress(0);
          } else if (currentRun.status === "Error" || currentRun.status === "Failed") {
            setIsRunning(false);
            stopPolling();
            toast.error("Simulation failed!");
          } else if (currentRun.status === "Cancelled") {
            setIsRunning(false);
            setProgress(0);
            stopPolling();
            console.log("Simulation was cancelled, stopping polling");
          }
        } else {
          setIsRunning(false);
          setProgress(0);
          stopPolling();
        }
      }
    } catch (error) {
      console.error("Failed to poll simulation progress:", error);
    }
  }, [
    activeSimulation?.id,
    activeSimulation?.modelId,
    refetchSimulationRuns,
    stopPolling,
    getSimulationResult,
    getSimulationsByModelId,
    getImpulseResponseBySimulationId,
  ]);

  const startSimulation = useCallback(async () => {
    const modelId = currentModelId || activeSimulation?.modelId;

    if (!activeSimulation?.id || !modelId) {
      toast.error("No active simulation or model selected");
      return;
    }

    // Ensure any previous reset timers are cleared to avoid resetting a new run's progress
    setIsRunning(true);
    setProgress(0);

    try {
      await patchMeshes({ modelId }).unwrap();

      await runSimulation({ simulationId: activeSimulation.id }).unwrap();
      toast.success("Simulation started!");

      pollIntervalRef.current = setInterval(pollProgress, 1000);

      pollProgress();
    } catch (error) {
      console.error("Failed to start simulation:", error);
      toast.error("Failed to start simulation");
      setIsRunning(false);
      setProgress(0);
    }
  }, [
    activeSimulation?.id,
    activeSimulation?.modelId,
    currentModelId,
    patchMeshes,
    runSimulation,
    pollProgress,
  ]);

  useEffect(() => {
    if (activeSimulation?.id && activeSimulation.id !== lastCheckedSimulationId.current) {
      refetchSimulationRuns();
    }
  }, [activeSimulation?.id, refetchSimulationRuns]);

  useEffect(() => {
    if (!activeSimulation?.id || !simulationRuns) {
      return;
    }

    if (
      lastCheckedSimulationId.current === activeSimulation.id &&
      hasCheckedForRunningSimulation.current
    ) {
      return;
    }

    if (isRunning || pollIntervalRef.current) {
      return;
    }

    const currentRun = simulationRuns.find((run) => run.simulation.id === activeSimulation.id);

    if (currentRun) {
      const isCurrentlyRunning =
        currentRun.status !== "Completed" &&
        currentRun.status !== "Error" &&
        currentRun.status !== "Failed" &&
        currentRun.status !== "Cancelled" &&
        currentRun.percentage < 100;

      if (isCurrentlyRunning) {
        console.log("Resuming simulation polling - Progress:", currentRun.percentage);
        setIsRunning(true);
        setProgress(currentRun.percentage);

        pollIntervalRef.current = setInterval(pollProgress, 1000);
        pollProgress();
      }
    }

    hasCheckedForRunningSimulation.current = true;
    lastCheckedSimulationId.current = activeSimulation.id;
  }, [activeSimulation?.id, simulationRuns, isRunning, pollProgress, refetchSimulationRuns]);

  useEffect(() => {
    if (activeSimulation?.id !== lastCheckedSimulationId.current) {
      hasCheckedForRunningSimulation.current = false;

      if (pollIntervalRef.current) {
        stopPolling();
        setIsRunning(false);
        setProgress(0);
      }
    }
  }, [activeSimulation?.id, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isRunning,
    progress,
    startSimulation,
    cancelAndStop,
  };
}
