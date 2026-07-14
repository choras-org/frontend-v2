import type { CompatibilityStatus } from "@/types/model";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedSimulationMethod } from "@/store/simulationSettingsSlice";
import type { RootState } from "@/store";
import type { SelectedSimulationMethod } from "@/types/simulationSettings";
import { CheckCircle2 } from "lucide-react";

export interface SimulationMethodItem {
  id: string;
  label: string;
  description: string;
  compatible: CompatibilityStatus;
}

interface SimulationMethodListProps {
  methods: SimulationMethodItem[];
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

export function SimulationMethodList({ methods }: SimulationMethodListProps) {
  const dispatch = useDispatch();
  const selectedMethod = useSelector(
    (state: RootState) => state.simulationSettings.selectedSimulationMethod,
  );

  const handleMethodClick = (method: SimulationMethodItem) => {
    const newSelection: SelectedSimulationMethod = {
      id: method.id,
      label: method.label,
      compatible: method.compatible,
    };
    dispatch(setSelectedSimulationMethod(newSelection));
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
              {isSelected && <CheckCircle2 size={16} className="text-choras-primary" />}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className={`text-sm font-bold ${styles.label}`}>{method.label}</span>
              {method.description && (
                <span className="text-xs text-slate-500">{method.description}</span>
              )}
              <span className={`text-xs font-semibold ${styles.status}`}>{styles.text}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
