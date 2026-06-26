import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from "react-router";
import { useGetModelSimulationCompatibilityQuery } from "@/store/modelApi";
import type { CompatibilityStatus } from "@/types/model";
import { SimulationMethodList, type SimulationMethodItem } from "./SimulationMethodList";

interface IProps {
  modelId?: string | number;
}

const isSupported = (status: CompatibilityStatus) =>
  status === "compatible" || status === "warning";

export function PossibleSimulation({ modelId: modelIdProp }: IProps) {
  const params = useParams() as { modelId?: string };
  const modelId = modelIdProp ?? params.modelId ?? "";

  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, isError } = useGetModelSimulationCompatibilityQuery(modelId, {
    skip: !modelId,
  });

  const methods: SimulationMethodItem[] = (data?.methods ?? []).map((method) => ({
    id: method.simulationType,
    label: method.label ?? method.simulationType,
    description: "",
    compatible: method.compatible,
  }));

  const supportedCount = methods.filter((m) => isSupported(m.compatible)).length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-left"
      >
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-choras-primary">
            Possible Simulation
          </h4>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Choose algorithm then run a new simulation.
          </p>
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-choras-primary/10 px-2 py-0.5 text-[10px] font-bold text-choras-primary">
            {supportedCount} of {methods.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="mt-2 rounded-md border border-slate-200 bg-white/60 px-3 py-3">
          {isLoading ? (
            <p className="text-xs text-slate-500">Loading compatibility…</p>
          ) : isError ? (
            <p className="text-xs text-red-500">Failed to load simulation compatibility.</p>
          ) : methods.length === 0 ? (
            <p className="text-xs text-slate-500">No simulation methods available.</p>
          ) : (
            <SimulationMethodList methods={methods} />
          )}
        </div>
      )}
    </div>
  );
}
