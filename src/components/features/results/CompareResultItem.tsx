import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  useGetSimulationResultQuery,
  useGetSimulationsByModelIdQuery,
  useLazyGetSimulationResultQuery,
} from "@/store/simulationApi";
import { useGetSimulationMethodsQuery } from "@/store/simulationSettingsApi";
import { formatDate } from "@/helpers/datetime";
import { CheckCircleIcon, X } from "lucide-react";
import type { Parameters, Simulation } from "@/types/simulation";
import { useDispatch, useSelector } from "react-redux";
import { removeCompareResult, updateCompareResult } from "@/store/simulationSlice";
import { http } from "@/libs/http";
import { downloadFile, formatFilename } from "@/helpers/file";
import { toast } from "sonner";
import { useState } from "react";
import { useGetModelQuery } from "@/store/modelApi";
import { ChooseModel } from "./ChooseModel";
import { selectCompareResults, selectCompareSimulationIds } from "@/store/simulationSelector";
import { useNavigate } from "react-router";

interface CompareResultItemProps {
  order: number;
  id: string;
  simulationId: number | null;
  sourceId: string | null;
  receiverId: string | null;
  color: string;
  modelId: number;
  isCurrent: boolean;
}

export function CompareResultItem({
  order,
  id,
  simulationId,
  sourceId,
  receiverId,
  color,
  modelId,
}: CompareResultItemProps) {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const dispatch = useDispatch();
  const { data: model } = useGetModelQuery(modelId?.toString(), { skip: !modelId });
  const { data: simulations } = useGetSimulationsByModelIdQuery(modelId, {
    skip: !modelId,
    refetchOnMountOrArgChange: true,
  });
  const { data: methods } = useGetSimulationMethodsQuery();
  const { data: results } = useGetSimulationResultQuery(simulationId!, {
    skip: !simulationId,
  });
  const [getSimulationResult] = useLazyGetSimulationResultQuery();
  const simulationIds = useSelector(selectCompareSimulationIds);
  const compareResults = useSelector(selectCompareResults);

  const selectedSimulation = simulations?.find((sim) => sim.id === simulationId);
  const selectedMethod = selectedSimulation
    ? methods?.find((method) => method.simulationType === selectedSimulation.taskType)
    : null;

  const handleUpdate = (field: string, value: unknown) => {
    dispatch(updateCompareResult({ id, field, value }));
  };

  const handleRemove = () => {
    dispatch(removeCompareResult(id));

    if (order === 1) {
      // Pick the next result to navigate to
      const result = compareResults[1];
      navigate(`/editor/${result.modelId}/${result.simulationId}/results`);
    }
  };

  const handleDownload = async () => {
    if (!simulationId || !sourceId || !receiverId || !results) {
      return;
    }
    try {
      setIsDownloading(true);
      const result = results[0];
      const paramertes = result.responses[0].parameters;
      const parameters = Object.keys(paramertes) as (keyof Parameters)[];
      const availableFreqs = result.frequencies;
      const output = {
        xlsx: ["true"],
        Parameters: parameters,
        EDC: availableFreqs.map((freq) => `${freq}Hz`),
        Auralization: ["wavIR", "csvIR"],
        SimulationId: [simulationId],
      };

      // Request the export
      const { data } = await http({
        method: "POST",
        url: "/exports/custom_export",
        data: output,
        responseType: "blob",
      });

      // Download the file
      downloadFile(data, formatFilename(`simulation ${simulationId} results.zip`));

      toast.success("Download started successfully");
    } catch {
      toast.error("Failed to start download");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulationIdChange = (value: string) => {
    const newSimulationId = parseInt(value);
    handleUpdate("simulationId", newSimulationId);

    // Find the selected simulation and auto-select first source and receiver
    const simulation = simulations?.find((sim) => sim.id === newSimulationId);
    if (simulation) {
      getSimulationResult(newSimulationId);

      const firstSourceId = simulation.sources?.[0]?.id || null;
      const firstReceiverId = simulation.receivers?.[0]?.id || null;

      if (firstSourceId) {
        handleUpdate("sourceId", firstSourceId);
      }
      if (firstReceiverId) {
        handleUpdate("receiverId", firstReceiverId);
      }
    }
  };

  // Get sources and receivers from selected simulation
  const sources = selectedSimulation?.sources || [];
  const receivers = selectedSimulation?.receivers || [];

  return (
    <div className="border-y border-stone-600 p-4 space-y-4 relative">
      {model && (
        <div className="text-xs flex items-center justify-between gap-3 font-inter text-white/60">
          <p className=" truncate">
            {model.projectName} {">"} {model.modelName}
          </p>
          <ChooseModel
            onModelSelect={(modelId) => {
              handleUpdate("modelId", modelId);
              handleUpdate("simulationId", null);
              handleUpdate("sourceId", null);
              handleUpdate("receiverId", null);
            }}
            trigger={<p className="shrink underline">choose...</p>}
          />
        </div>
      )}

      <div className="flex items-center">
        <div
          className="font-inter font-bold text-sm w-6 h-6 flex justify-center items-center shrink-0"
          style={{ borderColor: color, borderWidth: 1, color }}
        >
          {order}
        </div>
        <span className="text-white text-base font-inter font-normal ml-3">Simulation</span>
        <div className="flex-1 ml-8">
          <Select value={simulationId?.toString()} onValueChange={handleSimulationIdChange}>
            <SelectTrigger className="bg-choras-dark text-white border-choras-gray [&>svg]:text-choras-gray w-full">
              <SelectValue placeholder="Select simulation">
                {selectedSimulation ? selectedSimulation.name : "Select simulation"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-choras-dark border-choras-gray">
              {simulations
                ?.filter((simulation) => simulation.completedAt !== null)
                .map((simulation) => (
                  <CustomSelectItem key={simulation.id} simulation={simulation} />
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMethod && (
        <p className="text-white/60 text-xs text-right">
          Method: {selectedMethod.label.replace("method", "")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-white/60 text-xs">Source</label>
          <Select
            disabled={!simulationId}
            value={sourceId?.toString()}
            onValueChange={(value) => handleUpdate("sourceId", value)}
          >
            <SelectTrigger className="bg-choras-dark text-white border-choras-gray [&>svg]:text-choras-gray w-full">
              <SelectValue placeholder="Select source">
                {sources.find((s) => s.id === sourceId?.toString())?.label || "Select source"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-choras-dark border-choras-gray">
              {sources.map((source) => (
                <SelectItem
                  key={source.id}
                  value={source.id.toString()}
                  className="bg-choras-dark hover:bg-choras-dark/90 active:bg-choras-dark/80 text-white"
                >
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-white/60 text-xs">Receiver</label>
          <Select
            disabled={!simulationId}
            value={receiverId?.toString()}
            onValueChange={(value) => handleUpdate("receiverId", value)}
          >
            <SelectTrigger className="bg-choras-dark text-white border-choras-gray [&>svg]:text-choras-gray w-full">
              <SelectValue placeholder="Select receiver">
                {receivers.find((r) => r.id === receiverId?.toString())?.label || "Select receiver"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-choras-dark border-choras-gray">
              {receivers.map((receiver) => (
                <SelectItem
                  key={receiver.id}
                  value={receiver.id.toString()}
                  className="bg-choras-dark hover:bg-choras-dark/90 active:bg-choras-dark/80 text-white"
                >
                  {receiver.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex space-x-2">
        {!(order === 1 && simulationIds.length === 1) && (
          <Button onClick={handleRemove} size="icon" variant="destructive">
            <X size={20} />
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex-1 border-choras-accent text-choras-accent hover:bg-choras-accent hover:text-black"
        >
          {isDownloading ? "Downloading..." : "Download"}
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
      <p className="text-xs text-choras-gray inline-flex gap-2 items-center">
        <CheckCircleIcon className="text-green-600" size={14} /> Completed at:{" "}
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
