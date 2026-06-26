import type { CompatibilityStatus } from "@/types/model";

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
  return (
    <ul className="space-y-2">
      {methods.map((method) => {
        const styles = STATUS_STYLES[method.compatible] ?? STATUS_STYLES.unknown;

        return (
          <li
            key={method.id}
            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${styles.row}`}
          >
            <span className={`h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
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
