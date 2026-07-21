import { ChevronRight, CircleCheck, TriangleAlert, OctagonAlert } from "lucide-react";
import { Fragment } from "react";
import type { GeometryIssue, GeometryIssues } from "@/store/geometryIssueSlice";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { MethodCompatibilityData } from "@/types/simulationSettings";

type GeometryIssueListProps = {
  issues: GeometryIssues | null;
  selectedIssue: GeometryIssue | null;
  expandedIssueGroups: Record<string, boolean>;
  onToggleGroup: (groupKey: string) => void;
  onIssueClick: (isSelected: boolean, issue: GeometryIssue) => void;
  label?: string;
};

const formatIssuePoints = (points: number[][]) => {
  if (points.length === 0) return "No coordinates";

  const formatPoint = (point: number[]) =>
    `(${point.map((value) => Number(value.toFixed(3))).join(", ")})`;

  if (points.length === 1) return formatPoint(points[0]);

  const firstPoint = formatPoint(points[0]);
  const secondPoint = formatPoint(points[1]);
  const remainingPoints = points.length - 2;

  if (remainingPoints > 0) {
    return `${firstPoint} | ${secondPoint} | +${remainingPoints} more`;
  }

  return `${firstPoint} | ${secondPoint}`;
};

const formatIssueCategoryLabel = (category: string) => {
  return category.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const ISSUE_CATEGORY_INFO: Record<string, { description: string; docsUrl: string }> = {
  duplicate_vertex: {
    description: "Multiple vertices share the same position, causing redundant geometry data.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  non_planar_face: {
    description: "Face vertices do not lie on the same plane, leading to rendering artifacts.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  t_junction: {
    description: "A vertex lies on the edge of another face without being connected, causing gaps.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  possible_hole: {
    description: "Open boundaries detected in the mesh that may indicate missing faces.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  boundary_edge: {
    description: "Edges shared by only one face, indicating an open or incomplete mesh.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  degenerate_face: {
    description: "Faces with zero area or collinear vertices that cannot be rendered correctly.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  intersection: {
    description: "Faces that intersect each other, creating invalid overlapping geometry.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  overlapping_face: {
    description: "Two or more faces occupy the same space, causing potential simulation issues.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  small_face: {
    description: "A face whose area is below the recommended size threshold.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  collinear_face: {
    description: "A face whose vertices are collinear or nearly collinear (collapsed to a line).",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
  inverted_normal: {
    description: "A face is wound so its normal points the wrong way.",
    docsUrl: "https://choras.readthedocs.io/en/latest/includes/setup/setup_user.html",
  },
};

const isSameIssue = (current: GeometryIssue | null, target: GeometryIssue) => {
  if (current?.id && target.id) {
    return current.id === target.id;
  }
  return (
    current?.type === target.type &&
    JSON.stringify(current?.points) === JSON.stringify(target.points)
  );
};

const getIssueRowClassName = (isSelected: boolean) => {
  const selectedClass =
    "bg-choras-primary/12 ring-1 ring-choras-primary/35 border-choras-primary/35";
  const defaultClass = "hover:bg-black/5 border-transparent";
  return `rounded-md border border-b border-choras-gray/60 transition-colors cursor-pointer ${isSelected ? selectedClass : defaultClass}`;
};

const getIssueCellClassName = (isSelected: boolean) => {
  const selectedClass = "rounded-md bg-choras-primary/12 ring-1 ring-choras-primary/35";
  const defaultClass = "rounded-md hover:bg-black/5";
  return `pr-3 pl-8 py-3 text-sm text-left transition-colors ${isSelected ? selectedClass : defaultClass}`;
};

const getCompatibilityIconInfo = (
  issueType: string,
  compatibilityData: MethodCompatibilityData[] | null,
): { icon: React.ReactNode; status: string; color: string; tooltip: string } | null => {
  if (!compatibilityData || compatibilityData.length === 0) {
    return null;
  }

  // Find the first method's compatibility for this issue type
  const methodCompatibility = compatibilityData[0];
  if (!methodCompatibility || !methodCompatibility.issues) {
    return null;
  }

  const issueCompatibility = methodCompatibility.issues[issueType];
  if (!issueCompatibility) {
    return null;
  }

  const compatibility = issueCompatibility.compatibility || issueCompatibility;

  switch (compatibility) {
    case "compatible":
      return {
        icon: <CircleCheck size={14} className="text-green-600" />,
        status: "Compatible",
        color: "text-green-600",
        tooltip: "This issue type is compatible with the selected method",
      };
    case "warning":
      return {
        icon: <TriangleAlert size={14} className="text-amber-600" />,
        status: "Warning",
        color: "text-amber-600",
        tooltip: "This issue type may break the selected method",
      };
    case "incompatible":
      return {
        icon: <OctagonAlert size={14} className="text-red-600" />,
        status: "Incompatible",
        color: "text-red-600",
        tooltip: "This issue type is incompatible with the selected method",
      };
    default:
      return null;
  }
};

export function GeometryIssueList({
  issues,
  selectedIssue,
  expandedIssueGroups,
  onToggleGroup,
  onIssueClick,
  label,
}: GeometryIssueListProps) {
  const compatibilityData = useSelector(
    (state: RootState) => state.simulationSettings.compatibilityData,
  );

  return (
    <div className="rounded-md border border-slate-300 bg-white/75 p-2 flex flex-col min-h-0 flex-1 h-full">
      <div className="mb-3 mt-1 flex shrink-0 items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2">
        <h4 className="font-semibold tracking-wide text-choras-primary">
          {label ? label : "Issues"}
        </h4>
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        <div className="absolute inset-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-400/80 scrollbar-track-transparent scrollbar-thumb-rounded-full">
          <table className="w-full table-fixed">
            <tbody>
              {issues &&
                Object.entries(issues).map((el) => {
                  const issueType = el[0];
                  const issueList = el[1];
                  const isExpanded = expandedIssueGroups[issueType];

                  const groupedIssues = issueList.reduce((acc, issue, index) => {
                    const key = issue.id ?? `no-id-${index}`;
                    const existingGroup = acc.get(key);
                    if (existingGroup) {
                      existingGroup.push(issue);
                    } else {
                      acc.set(key, [issue]);
                    }
                    return acc;
                  }, new Map<string, GeometryIssue[]>());

                  const issueRows = Array.from(groupedIssues.values()).map((group) => {
                    const primaryIssue = group[0];
                    const points = group.flatMap((groupIssue) => groupIssue.points);
                    const typeCounts = group.reduce(
                      (acc, groupIssue) => {
                        acc[groupIssue.type] = (acc[groupIssue.type] ?? 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    );

                    return {
                      issue: primaryIssue,
                      points,
                      issueForSelection: { ...primaryIssue, points },
                      types: Array.from(new Set(group.map((groupIssue) => groupIssue.type))),
                      elementSummary: Object.entries(typeCounts),
                    };
                  });
                  const hasIssues = issueRows.length > 0;

                  return (
                    hasIssues && (
                      <Fragment key={issueType}>
                        <tr className="border-b border-slate-200">
                          <td colSpan={2} className="px-3 py-2 text-sm text-left">
                            <div className="flex w-full items-center gap-2">
                              <button
                                type="button"
                                disabled={!hasIssues}
                                onClick={() => onToggleGroup(issueType)}
                                className={`flex flex-1 items-center gap-2 rounded-md px-1 py-1 font-medium transition-colors ${
                                  hasIssues
                                    ? "cursor-pointer hover:bg-black/5 text-slate-700"
                                    : "cursor-not-allowed text-slate-400 opacity-55"
                                }`}
                              >
                                <span
                                  className={`transform transition-transform ${isExpanded ? "rotate-90" : "rotate-0"} ${
                                    !hasIssues ? "text-slate-300" : ""
                                  }`}
                                >
                                  <ChevronRight size={16} />
                                </span>
                                <span>{formatIssueCategoryLabel(issueType)}</span>
                                <span className="ml-auto flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      hasIssues
                                        ? "bg-slate-200 text-slate-600"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {issueRows.length}
                                  </span>
                                  {compatibilityData &&
                                    (() => {
                                      const compatInfo = getCompatibilityIconInfo(
                                        issueType,
                                        compatibilityData,
                                      );
                                      return compatInfo ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center justify-center shrink-0">
                                              {compatInfo.icon}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="text-xs">
                                            {compatInfo.tooltip}
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : null;
                                    })()}
                                </span>
                              </button>
                              {ISSUE_CATEGORY_INFO[issueType] && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={ISSUE_CATEGORY_INFO[issueType].docsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-400 hover:border-choras-primary hover:text-choras-primary transition-colors"
                                    >
                                      ?
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-56">
                                    <p className="mb-1">
                                      {ISSUE_CATEGORY_INFO[issueType].description}
                                    </p>
                                    <p className="text-[10px] opacity-70">
                                      Click to open documentation ↗
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded &&
                          issueRows.map((issueRow, index) => {
                            const isSelected = isSameIssue(selectedIssue, issueRow.issue);
                            const isLastChild = index === issueRows.length - 1;

                            return (
                              <tr
                                key={`${issueType}-${index}`}
                                onClick={() => onIssueClick(isSelected, issueRow.issueForSelection)}
                                className={`${getIssueRowClassName(isSelected)} group ${
                                  isLastChild ? "border-b border-slate-200" : ""
                                }`}
                              >
                                <td
                                  colSpan={2}
                                  className={`${getIssueCellClassName(isSelected)} relative pr-3 py-3`}
                                >
                                  <div
                                    className={`absolute left-4 top-2 bottom-2 w-0.5 rounded-full transition-all duration-200 ${
                                      isSelected
                                        ? "bg-choras-primary scale-y-100"
                                        : "bg-slate-200 scale-y-50 opacity-0 group-hover:opacity-100 group-hover:scale-y-75"
                                    }`}
                                  />

                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="shrink-0 font-mono text-[11px] font-bold text-slate-400">
                                        {String(index + 1).padStart(2, "0")}
                                      </span>
                                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-600 uppercase">
                                        {issueRow.types.join(" + ")}
                                      </span>
                                    </div>
                                    <div className="relative w-full">
                                      <span
                                        className="block truncate font-mono text-[11px] text-slate-400 bg-slate-50/50 p-1 rounded border border-slate-100"
                                        title={formatIssuePoints(issueRow.points)}
                                      >
                                        {formatIssuePoints(issueRow.points)}
                                      </span>
                                    </div>
                                    {issueRow.elementSummary.length > 0 && (
                                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                        {issueRow.elementSummary.map(([elementType, count]) => (
                                          <span
                                            key={`${issueType}-${index}-${elementType}`}
                                            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors group-hover:border-slate-300"
                                          >
                                            <span className="mr-1 text-slate-400 lowercase">
                                              {elementType}:
                                            </span>
                                            <span className="font-bold text-slate-600">
                                              {count}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </Fragment>
                    )
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
