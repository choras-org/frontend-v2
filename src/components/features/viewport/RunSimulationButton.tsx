import { Play, Square, AlertTriangle, ChartColumn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSimulationRunner } from "@/hooks/useSimulationRunner";
import { useSimulationValidation } from "@/hooks/useSimulationValidation";
import { useDuplicateSimulation } from "@/hooks/useDuplicateSimulation";
import { useDispatch } from "react-redux";
import { navigateToTabAndHighlight } from "@/store/tabSlice";
import { setActiveSimulation, setShouldAutoRun } from "@/store/simulationSlice";
import { useParams, useNavigate } from "react-router";
import { useGetSimulationsByModelIdQuery } from "@/store/simulationApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export function RunSimulationButton() {
  const { isRunning, progress, startSimulation, cancelAndStop } = useSimulationRunner();
  const { isValid, errors } = useSimulationValidation();
  const { duplicateSimulation } = useDuplicateSimulation();
  const { modelId, simulationId } = useParams() as { modelId: string; simulationId?: string };
  const { data: simulations } = useGetSimulationsByModelIdQuery(+modelId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const shouldAutoRun = useSelector((state: RootState) => state.simulation.shouldAutoRun);
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);

  const currentSimulation = simulations?.find((sim) => sim.id === Number(simulationId));

  const isCompletedRun =
    currentSimulation?.simulationRun?.status === "Completed" &&
    currentSimulation?.simulationRun?.percentage === 100;

  const editedAfterCompletion =
    currentSimulation?.updatedAt &&
    currentSimulation?.simulationRun?.completedAt &&
    new Date(currentSimulation.updatedAt) > new Date(currentSimulation.simulationRun.completedAt);

  const isCompleted = isCompletedRun && !editedAfterCompletion;

  useEffect(() => {
    if (shouldAutoRun && activeSimulation && isValid && !isRunning) {
      dispatch(setShouldAutoRun(false));

      setTimeout(() => {
        startSimulation();
      }, 300);
    }
  }, [shouldAutoRun, activeSimulation, isValid, isRunning, dispatch, startSimulation]);

  const handleClick = () => {
    if (isCompleted) {
      navigate(`/editor/${modelId}/${simulationId}/results`);
    } else if (isRunning) {
      cancelAndStop();
    } else if (!isValid) {
      const firstError = errors[0];
      dispatch(
        navigateToTabAndHighlight({
          tab: firstError.navigationTarget,
          element: firstError.highlightTarget,
        }),
      );
    } else {
      if (isCompletedRun && editedAfterCompletion) {
        setShowOverwriteDialog(true);
      } else {
        startSimulation();
      }
    }
  };

  const handleOverrideResults = () => {
    setShowOverwriteDialog(false);
    startSimulation();
  };

  const handleDuplicateAndRun = async () => {
    if (!currentSimulation || !simulations) return;

    setShowOverwriteDialog(false);

    try {
      const newSimulation = await duplicateSimulation(currentSimulation, simulations, {
        navigateToNew: false,
        successMessage: "Simulation duplicated successfully!",
      });

      if (newSimulation) {
        dispatch(setActiveSimulation(newSimulation));
        dispatch(setShouldAutoRun(true));

        navigate(`/editor/${modelId}/${newSimulation.id}`);
      }
    } catch (error) {
      console.error("Failed to duplicate and run:", error);
    }
  };

  const getTooltipText = () => {
    if (isCompleted) {
      return "Show Results";
    }
    if (isRunning) {
      return `Running Simulation (${Math.round(progress)}%)`;
    }
    if (!isValid) {
      return errors.map((error) => error.message).join(", ");
    }
    return "Run Simulation";
  };

  if (!simulations || simulations.length === 0 || !simulationId) {
    return null;
  }

  return (
    <>
      <div
        className={isRunning ? "flex items-center gap-0 bg-choras-dark rounded-full p-2" : "p-2"}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleClick}
                size="icon"
                variant={
                  isCompleted
                    ? "custom1"
                    : isRunning
                      ? "secondary"
                      : !isValid
                        ? "custom2"
                        : "default"
                }
                className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer relative z-10"
                style={isCompleted ? { backgroundColor: "#f093fb" } : undefined}
              >
                {isCompleted ? (
                  <ChartColumn className="h-5 w-5" />
                ) : isRunning ? (
                  <Square className="h-4 w-4" fill="currentColor" />
                ) : !isValid ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" fill="currentColor" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isRunning && (
          <div className="h-20 mr-10 ml-6 flex items-center gap-4 flex-1">
            <span className="text-sm text-white font-bold whitespace-nowrap pl-4">Status:</span>
            <span className="text-sm text-white whitespace-nowrap pr-5">In progress</span>
            <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-choras-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-white font-medium whitespace-nowrap">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite previous results?</AlertDialogTitle>
            <AlertDialogDescription>
              This simulation has existing results. Running it again will overwrite the previous
              results. You can also duplicate this simulation to preserve the existing results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDuplicateAndRun}
              className="bg-choras-secondary hover:bg-choras-secondary/80 cursor-pointer"
            >
              Duplicate & Run
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleOverrideResults}
              className="bg-choras-primary hover:bg-choras-primary/80 cursor-pointer"
            >
              Override Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
