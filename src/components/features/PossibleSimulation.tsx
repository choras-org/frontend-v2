import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, OctagonAlert } from "lucide-react";
import { useParams } from "react-router";
import { useGetModelSimulationCompatibilityQuery } from "@/store/modelApi";
import type { CompatibilityStatus, MethodCompatibility } from "@/types/model";
import { SimulationMethodList, type SimulationMethodItem } from "./SimulationMethodList";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedSimulationMethod, setCompatibilityData } from "@/store/simulationSettingsSlice";
import type { RootState } from "@/store";
import type { MethodCompatibilityData, CompatibilityIssue } from "@/types/simulationSettings";
import { toast } from "sonner";

interface IProps {
  modelId?: string | number;
  /** Which compatibility block to display: the initial (pre-repair) geometry
   * or the repaired geometry. Defaults to "repaired". */
  stage?: "initial" | "repaired";
  /** Skip fetching compatibility (e.g. while the repair pipeline is still
   * running and the repaired report does not exist yet). */
  skip?: boolean;
}

const isSupported = (status: CompatibilityStatus) =>
  status === "compatible" || status === "warning";

export function PossibleSimulation({ modelId: modelIdProp, stage = "repaired", skip }: IProps) {
  const params = useParams() as { modelId?: string };
  const modelId = modelIdProp ?? params.modelId ?? "";

  const [isExpanded, setIsExpanded] = useState(false);
  const dispatch = useDispatch();

  const selectedMethod = useSelector(
    (state: RootState) => state.simulationSettings.selectedSimulationMethod,
  );

  const { data, isLoading, isError } = useGetModelSimulationCompatibilityQuery(modelId, {
    skip: !modelId || Boolean(skip),
  });

  const block = stage === "initial" ? data?.initialCompatibility : data?.repairedCompatibility;

  const methods: SimulationMethodItem[] = (block?.methods ?? []).map(
    (method: MethodCompatibility) => ({
      id: method.simulationType,
      label: method.label ?? method.simulationType,
      description: "",
      compatible: method.compatible,
      reason: method.reason ?? undefined,
    }),
  );

  // Store compatibility data in Redux when fetched
  useEffect(() => {
    if (block?.methods) {
      const compatData: MethodCompatibilityData[] = block.methods.map((method) => {
        // Convert issues array to Record indexed by kind
        const issuesRecord: Record<
          string,
          { compatibility: string; label: string; present: boolean }
        > = {};
        if (Array.isArray(method.issues)) {
          method.issues.forEach((issue: CompatibilityIssue) => {
            issuesRecord[issue.kind] = {
              compatibility: issue.compatibility || "unknown",
              label: issue.label || "Unknown",
              present: issue.present,
            };
          });
        }

        return {
          simulationType: method.simulationType,
          label: method.label ?? null,
          compatible: method.compatible,
          issues: issuesRecord,
        };
      });
      dispatch(setCompatibilityData({ stage, data: compatData }));
    }
  }, [block, dispatch, stage]);

  // Auto-select first method if not already selected
  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      const firstMethod = methods[0];
      dispatch(
        setSelectedSimulationMethod({
          id: firstMethod.id,
          label: firstMethod.label,
          compatible: firstMethod.compatible,
        }),
      );
    }
  }, [methods, selectedMethod, dispatch]);

  // Show toast when method is selected
  useEffect(() => {
    if (selectedMethod) {
      toast.info(
        <div className="flex items-center gap-2">
          <div>
            <p className="font-semibold">"{selectedMethod.label}" selected</p>
            <p className="text-sm">
              Check issue types with <OctagonAlert size={14} className="inline text-red-600 mx-1" />{" "}
              to see which incompatible issues need attention.
            </p>
          </div>
        </div>,
        {
          duration: 5000,
        },
      );
    }
  }, [selectedMethod?.id]);

  const supportedCount = methods.filter((m) => isSupported(m.compatible)).length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full flex-col items-start rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-left"
      >
        <h4 className="mb-2 text-sm font-semibold tracking-wide text-choras-primary">
          Simulation Method Compatibility
        </h4>
        <div className="flex w-full items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Select a simulation method to view its{" "}
            <span className="font-bold text-red-500">high-severity</span> issue types.
          </p>
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
            <SimulationMethodList methods={methods} stage={stage} />
          )}
        </div>
      )}
    </div>
  );
}
