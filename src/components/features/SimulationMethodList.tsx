import type { CompatibilityStatus } from "@/types/model";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedSimulationMethod } from "@/store/simulationSettingsSlice";
import type { RootState } from "@/store";
import type { SelectedSimulationMethod } from "@/types/simulationSettings";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export interface SimulationMethodItem {
  id: string;
  label: string;
  description: string;
  compatible: CompatibilityStatus;
  reason?: string;
}

interface SimulationMethodListProps {
  methods: SimulationMethodItem[];
  stage?: "initial" | "repaired";
}

const STATUS_STYLES: Record<
  CompatibilityStatus,
  { row: string; dot: string; label: string; status: string; text: string }
> = {
  compatible: {
    row: "border-green-200 bg-green-50",
    dot: "bg-green-500",
    label: "text-slate-700",
    status: "text-green-600",
    text: "Supported",
  },
  warning: {
    row: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
    label: "text-slate-700",
    status: "text-amber-600",
    text: "Warning",
  },
  incompatible: {
    row: "border-red-200 bg-red-50",
    dot: "bg-red-400",
    label: "text-slate-400",
    status: "text-red-400",
    text: "Not Supported",
  },
  unknown: {
    row: "border-slate-200 bg-slate-50",
    dot: "bg-slate-300",
    label: "text-slate-400",
    status: "text-slate-400",
    text: "Unknown",
  },
};

export function SimulationMethodList({ methods, stage = "repaired" }: SimulationMethodListProps) {
  const dispatch = useDispatch();
  const selectedMethod = useSelector(
    (state: RootState) => state.simulationSettings.selectedSimulationMethod,
  );
  const compatibilityData = useSelector((state: RootState) =>
    stage === "initial"
      ? state.simulationSettings.initialCompatibilityData
      : state.simulationSettings.repairedCompatibilityData,
  );

  const handleMethodClick = (method: SimulationMethodItem) => {
    const newSelection: SelectedSimulationMethod = {
      id: method.id,
      label: method.label,
      compatible: method.compatible,
    };
    dispatch(setSelectedSimulationMethod(newSelection));
  };

  const hasHighSeverityIssues = (method: SimulationMethodItem): boolean => {
    if (!compatibilityData || compatibilityData.length === 0) return false;

    // Find the current method's data
    const methodData = compatibilityData.find((m) => m.simulationType === method.id);
    if (!methodData || !methodData.issues) return false;

    // Check if any issue type is incompatible AND actually present in the geometry
    return Object.values(methodData.issues).some(
      (issue) => issue.compatibility === "incompatible" && issue.present,
    );
  };

  const shouldShowUnknownReasonIcon = (method: SimulationMethodItem): boolean => {
    // Show icon if method is not compatible and there are no high-severity issues
    const isNotCompatible = method.compatible == "incompatible";
    const hasHighSeverity = hasHighSeverityIssues(method);
    return isNotCompatible && !hasHighSeverity;
  };

  return (
    <ul className="space-y-2">
      {methods.map((method) => {
        const styles = STATUS_STYLES[method.compatible] ?? STATUS_STYLES.unknown;
        const isSelected = selectedMethod?.id === method.id;

        return (
          <li
            key={method.id}
            onClick={() => handleMethodClick(method)}
            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-all ${
              isSelected
                ? "ring-2 ring-choras-primary/50 border-choras-primary bg-choras-primary/5"
                : styles.row
            } hover:border-slate-300 hover:shadow-sm`}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className={`h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className={`text-sm font-bold ${styles.label}`}>{method.label}</span>
              {method.description && (
                <span className="text-xs text-slate-500">{method.description}</span>
              )}
              <span className={`text-xs font-semibold ${styles.status}`}>{styles.text}</span>
            </div>
            {shouldShowUnknownReasonIcon(method) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-400 hover:border-choras-primary hover:text-choras-primary transition-colors"
                  >
                    ?
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="max-w-56">
                  <p>
                    {method.reason ||
                      "This method has compatibility issues not related to detected geometry problems"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </li>
        );
      })}
    </ul>
  );
}
