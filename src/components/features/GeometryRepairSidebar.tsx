import {
  clearSelectedIssue,
  setIssueGroupExpanded,
  setRemainingIssues,
  setSelectedIssue,
  type GeometryIssue,
} from "@/store/geometryIssueSlice";
import {
  useFetchModelIssuesQuery,
  useGetModelQuery,
  useSetRepairDecisionMutation,
} from "@/store/modelApi";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { toast } from "sonner";
import type { RootState } from "@/store";
import { SimulationForm } from "./SimulationForm";
import { Button } from "../ui/button";
import { GeometryIssueList } from "./GeometryIssueList";
import { PossibleSimulation } from "./PossibleSimulation";

type RepairSummaryItem = {
  category: string;
  fixed: number;
  remaining: number;
  unit: string;
};

const REPAIR_SUMMARY_EXAMPLE: RepairSummaryItem[] = [
  { category: "Deduplication", fixed: 100, remaining: 10, unit: "vertex" },
  { category: "T-Junction", fixed: 30, remaining: 0, unit: "issue" },
  { category: "Intersection", fixed: 8, remaining: 5, unit: "issue" },
];

export default function GeometryRepairSidebar() {
  const { modelId } = useParams() as { modelId: string };
  // Poll while the background geometry pipeline is still running so the sidebar
  // refreshes automatically once issues + repair become available.
  const [pollingInterval, setPollingInterval] = useState(0);
  const { data: model } = useGetModelQuery(modelId, { pollingInterval });
  const dispatch = useDispatch();
  const { remainingIssues, selectedIssue, expandedIssueGroups } = useSelector(
    (state: RootState) => {
      return state.geometryIssue;
    },
  );

  // Pick the issue report produced *after* the repair pipeline ran.
  const modelIssue = useMemo(() => {
    if (!model?.issues?.length) return undefined;
    return model.issues.find((issue) => issue.detectionStage === "AfterRepair");
  }, [model]);

  const hasRemainingIssues = (modelIssue?.issueCount ?? 0) > 0;

  // Only fetch the remaining-issue report when there are issues to display.
  const { data: fetchedRemainingIssues } = useFetchModelIssuesQuery(modelIssue?.fileUrl ?? "", {
    skip: !modelIssue || !hasRemainingIssues,
  });

  useEffect(() => {
    if (fetchedRemainingIssues) {
      dispatch(setRemainingIssues(fetchedRemainingIssues));
    }
  }, [fetchedRemainingIssues, dispatch]);

  const toggleIssueGroup = (groupKey: string) => {
    dispatch(clearSelectedIssue());
    dispatch(
      setIssueGroupExpanded({
        groupKey,
        isExpanded: !expandedIssueGroups[groupKey],
      }),
    );
  };

  const handleIssueClick = (isSelected: boolean, issue: GeometryIssue) => {
    if (isSelected) {
      dispatch(clearSelectedIssue());
      return;
    }

    dispatch(setSelectedIssue(issue));
  };

  const [setRepairDecision, { isLoading: isDeciding }] = useSetRepairDecisionMutation();
  const repairStatus = model?.repairStatus ?? null;

  const handleRepairDecision = async (decision: "accept" | "reject") => {
    try {
      await setRepairDecision({ modelId, decision }).unwrap();
      toast.success(
        decision === "accept"
          ? "Repaired geometry accepted"
          : "Repair undone, using original geometry",
      );
    } catch {
      toast.error("Failed to update repair decision");
    }
  };

  const [isRepairSummaryExpanded, setIsRepairSummaryExpanded] = useState(true);

  const geometryStatus = model?.geometryStatus ?? null;
  const isProcessing = geometryStatus === "Pending" || geometryStatus === "Processing";
  const isFailed = geometryStatus === "Failed";
  const geometryProgress = model?.geometryProgress ?? 0;

  useEffect(() => {
    setPollingInterval(isProcessing ? 2000 : 0);
  }, [isProcessing]);

  return (
    <div className="h-container flex flex-col border border-slate-300 bg-[#DCDCDC] p-1">
      <div className="h-full flex flex-col rounded-md bg-white/65 text-slate-700 font-inter p-2">
        <div className="min-h-0 flex flex-1 flex-col pr-1">
          {isProcessing ? (
            <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin text-choras-primary" />
                <span className="text-sm font-semibold">Analyzing &amp; repairing geometry…</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-choras-primary transition-all duration-500"
                  style={{ width: `${geometryProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] text-slate-500">{geometryProgress}%</p>
            </div>
          ) : isFailed ? (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-600">Geometry processing failed</p>
              <p className="mt-1 text-[12px] text-red-500">
                The inspect &amp; repair pipeline could not complete for this model. Please try
                re-uploading the geometry.
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
              <PossibleSimulation />
              <div className="rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-2.5">
                <div className="mb-2 flex items-center justify-between rounded-md border border-slate-300 bg-white/80 px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Quick Action
                  </span>
                </div>
                <div className="mx-auto flex w-full max-w-md justify-center">
                  <SimulationForm
                    modelId={Number(modelId)}
                    className="w-full border-choras-primary/45 bg-white text-choras-primary hover:bg-choras-primary/10"
                  />
                </div>
                <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                  <Button
                    variant="outline"
                    className="w-full border-red-400 bg-white text-choras-primary hover:bg-choras-primary/10"
                  >
                    Download Fixed Model
                  </Button>
                </div>
                <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleRepairDecision("accept")}
                    disabled={isDeciding || repairStatus === "Accepted" || repairStatus === null}
                    className="w-full border-green-500 bg-white text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    {repairStatus === "Accepted" ? "Repair Accepted" : "Accept Repair"}
                  </Button>
                </div>
                <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleRepairDecision("reject")}
                    disabled={isDeciding || repairStatus === "Rejected" || repairStatus === null}
                    className="w-full border-red-400 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Undo Repair
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-4 rounded-md border border-slate-300 bg-white/75 p-3">
            <button
              onClick={() => setIsRepairSummaryExpanded((prev) => !prev)}
              className="mb-2 flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left"
            >
              <h4 className="text-base font-semibold tracking-wide text-choras-primary">
                Repair Summary
              </h4>
              {isRepairSummaryExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
            {isRepairSummaryExpanded && (
              <ul className="space-y-1.5 px-1">
                {REPAIR_SUMMARY_EXAMPLE.map((item) => (
                  <li key={item.category} className="text-[12px] text-slate-600">
                    <span className="font-semibold text-slate-700">{item.category}:</span>{" "}
                    {item.fixed} {item.unit} removed &amp;
                    <span
                      className={
                        item.remaining > 0
                          ? "text-amber-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {" "}
                      {item.remaining} remain
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <GeometryIssueList
            issues={remainingIssues}
            selectedIssue={selectedIssue}
            expandedIssueGroups={expandedIssueGroups}
            onToggleGroup={toggleIssueGroup}
            onIssueClick={handleIssueClick}
            label="Remaining Issue"
          />
        </div>
      </div>
    </div>
  );
}
