import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteSimulationMutation,
  useGetSimulationsByModelIdQuery,
  useLazyGetSimulationsByModelIdQuery,
  useUpdateSimulationMutation,
} from "@/store/simulationApi";
import { useGetSimulationMethodsQuery } from "@/store/simulationSettingsApi";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/helpers/datetime";
import { CheckCircleIcon, FileText, GithubIcon, EllipsisVerticalIcon } from "lucide-react";
import type { Simulation } from "@/types/simulation";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMethodType } from "@/store/simulationSettingsSlice";
import { setActiveSimulation } from "@/store/simulationSlice";
import type { RootState } from "@/store";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimulationForm } from "../SimulationForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useDuplicateSimulation } from "@/hooks/useDuplicateSimulation";
import { useInitializeSimulationSettings } from "@/hooks/useInitializeSimulationSettings";
import {
  addReceiver,
  addSource,
  removeAllReceivers,
  removeAllSources,
} from "@/store/sourceReceiverSlice";

type SimulationPickerProps = {
  modelId: number;
  simulationId?: number;
};
export function SimulationPicker({ modelId, simulationId }: SimulationPickerProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [deleteSimulation] = useDeleteSimulationMutation();
  const { data: simulations, isLoading } = useGetSimulationsByModelIdQuery(modelId);
  const { data: methods, isLoading: methodsLoading } = useGetSimulationMethodsQuery();
  const [getSimulationsByModelId] = useLazyGetSimulationsByModelIdQuery();
  const { duplicateSimulation } = useDuplicateSimulation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [updateSimulation] = useUpdateSimulationMutation();
  const selectedMethodType = useSelector(
    (state: RootState) => state.simulationSettings.selectedMethodType,
  );
  const { initializeSettings } = useInitializeSimulationSettings();

  const handleMethodChange = async (methodType: string) => {
    dispatch(setSelectedMethodType(methodType));

    if (simulationId && simulations) {
      const currentSimulation = simulations.find((sim) => sim.id === simulationId);
      if (currentSimulation) {
        try {
          const updatedSimulation = await updateSimulation({
            id: simulationId,
            body: {
              modelId: currentSimulation.modelId,
              name: currentSimulation.name,
              status: currentSimulation.status,
              hasBeenEdited: currentSimulation.hasBeenEdited,
              taskType: methodType,
              solverSettings: currentSimulation.solverSettings,
            },
          }).unwrap();

          await initializeSettings(updatedSimulation, methodType);

          toast.success("Method updated and settings initialized");
        } catch (error) {
          console.error("Failed to update simulation method:", error);
          toast.error("Failed to update method");
        }
      }
    }
  };

  const handleSimulationChange = (simulationId: string) => {
    const selectedSimulation = simulations?.find((sim) => sim.id.toString() === simulationId);
    if (selectedSimulation) {
      dispatch(setActiveSimulation(selectedSimulation));
    }
    navigate(`/editor/${modelId}/${simulationId}`);
  };

  useEffect(() => {
    if (simulationId && simulations) {
      const currentSimulation = simulations.find((sim) => sim.id === simulationId);
      if (currentSimulation) {
        dispatch(setActiveSimulation(currentSimulation));

        if (currentSimulation.taskType && currentSimulation.taskType !== selectedMethodType) {
          dispatch(setSelectedMethodType(currentSimulation.taskType));
        }

        if (currentSimulation.sources.length > 0) {
          currentSimulation.sources.forEach((source) => {
            dispatch(addSource(source));
          });
        } else {
          dispatch(removeAllSources());
        }

        if (currentSimulation.receivers.length > 0) {
          currentSimulation.receivers.forEach((receiver) => {
            dispatch(addReceiver(receiver));
          });
        } else {
          dispatch(removeAllReceivers());
        }
      }
    }
  }, [simulationId, simulations, dispatch, selectedMethodType]);

  if (!simulations || simulations.length === 0 || isLoading || methodsLoading) {
    return (
      <Button variant="secondary" className="justify-start">
        Loading...
      </Button>
    );
  }

  const activeSimulation = simulations.find((sim) => sim.id === simulationId);

  const selectedMethod = methods?.find((method) => method.simulationType === selectedMethodType);

  const handleDeleteSimulation = async () => {
    try {
      await deleteSimulation({
        id: activeSimulation!.id,
        modelId: modelId,
      }).unwrap();

      if (simulations.length === 1) {
        await getSimulationsByModelId(modelId).unwrap();
        navigate(`/editor/${modelId}`, { replace: true });
      }

      toast.success("Simulation deleted successfully");
    } catch {
      toast.error("Failed to delete simulation");
    } finally {
      setMenuOpen(false);
    }
  };

  const handleDuplicateSimulation = async () => {
    if (!activeSimulation || !simulations) {
      toast.error("No simulation selected");
      return;
    }

    try {
      await duplicateSimulation(activeSimulation, simulations);
    } finally {
      setMenuOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 w-full items-center">
        <label htmlFor="simulation" className="font-medium text-white">
          Simulation:
        </label>
        <div className="col-span-2 flex">
          <Select onValueChange={handleSimulationChange} value={simulationId?.toString()}>
            <SelectTrigger className="bg-choras-dark text-white border-choras-gray [&>svg]:text-choras-gray w-[calc(100%-36px)]">
              <SelectValue>
                {activeSimulation && activeSimulation.completedAt && (
                  <CheckCircleIcon className="inline text-green-600" />
                )}
                {activeSimulation ? activeSimulation.name : "Select a simulation"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-choras-dark border-choras-gray">
              {simulations.map((simulation) => (
                <CustomSelectItem key={simulation.id} simulation={simulation} />
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="px-2 hover:bg-white/10 ml-2">
                <EllipsisVerticalIcon className="size-6 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <SimulationForm
                modelId={modelId}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Create New Simulation
                  </DropdownMenuItem>
                }
                onSuccess={() => setMenuOpen(false)}
              />

              <SimulationForm
                modelId={modelId}
                id={activeSimulation?.id}
                onSuccess={() => setMenuOpen(false)}
                defaultValues={
                  activeSimulation
                    ? {
                        name: activeSimulation.name,
                        description: activeSimulation.description,
                        status: activeSimulation.status,
                      }
                    : undefined
                }
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit Simulation
                  </DropdownMenuItem>
                }
              />

              <ConfirmDialog
                title="Duplicate Simulation"
                description={`Are you sure you want to duplicate "${activeSimulation?.name}"? A new simulation will be created with all the same settings.`}
                onConfirm={handleDuplicateSimulation}
                confirmVariant="default"
                confirmLabel="Duplicate"
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Duplicate Simulation
                  </DropdownMenuItem>
                }
              />

              <ConfirmDialog
                title="Delete Simulation"
                description="Are you sure you want to delete this simulation? This action cannot be undone."
                onConfirm={handleDeleteSimulation}
                confirmVariant="destructive"
                confirmLabel="Delete Simulation"
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-600"
                  >
                    Delete Simulation
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <label htmlFor="method" className="font-medium text-white">
          Method:
        </label>
        <div className="col-span-2">
          <Select value={selectedMethodType} onValueChange={handleMethodChange}>
            <SelectTrigger className="bg-choras-dark text-white border-choras-gray [&>svg]:text-choras-gray w-full">
              <SelectValue>
                {selectedMethod ? selectedMethod.label.replace("method", "") : "Select a method"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-choras-dark border-choras-gray">
              {methods?.map((method) => (
                <SelectItem
                  key={method.simulationType}
                  value={method.simulationType}
                  className="bg-choras-dark hover:bg-choras-dark/90 active:bg-choras-dark/80 text-white"
                >
                  {method.label.replace("method", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full items-center">
        <Button
          variant="outline"
          onClick={() =>
            selectedMethod?.repositoryURL && window.open(selectedMethod.repositoryURL, "_blank")
          }
          disabled={!selectedMethod?.repositoryURL}
          className="h-auto whitespace-normal py-2"
        >
          <div className="flex items-center gap-2 justify-center">
            <GithubIcon size={16} className="flex-shrink-0" />
            <span className="break-words text-left">{selectedMethodType} Repo</span>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            selectedMethod?.documentationURL &&
            window.open(selectedMethod.documentationURL, "_blank")
          }
          disabled={!selectedMethod?.documentationURL}
          className="h-auto whitespace-normal py-2"
        >
          <div className="flex items-center gap-2 justify-center">
            <FileText size={16} className="flex-shrink-0" />
            <span className="break-words text-left">{selectedMethodType} Docs</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

function CustomSelectItem({ simulation }: { simulation: Simulation }) {
  let timestamp = (
    <p className="text-xs text-choras-gray">Created at: {formatDate(simulation.createdAt)}</p>
  );

  if (simulation.completedAt) {
    timestamp = (
      <p className="text-xs text-choras-gray inline-flex gap-2">
        <CheckCircleIcon className="text-green-600" /> Completed at:{" "}
        {formatDate(simulation.completedAt)}
      </p>
    );
  }

  return (
    <SelectItem
      key={simulation.id}
      value={simulation.id.toString()}
      className="bg-choras-dark hover:bg-choras-dark/90 active:bg-choras-dark/80"
    >
      <div className="flex flex-col gap-1">
        <p className="text-choras-gray">{simulation.name}</p>
        {timestamp}
      </div>
    </SelectItem>
  );
}
