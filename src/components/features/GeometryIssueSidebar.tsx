import {
  clearSelectedIssue,
  setGeometryIssues,
  setIssueGroupExpanded,
  setSelectedIssue,
  type GeometryIssue,
} from "@/store/geometryIssueSlice";
import {
  useFetchModelIssuesQuery,
  useGetModelQuery,
  useGetModelSimulationCompatibilityQuery,
  useReprocessGeometryMutation,
  useSetRepairDecisionMutation,
} from "@/store/modelApi";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import type { RootState } from "@/store";
import { Button } from "../ui/button";
import { GeometryIssueList } from "./GeometryIssueList";
import { PossibleSimulation } from "./PossibleSimulation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GeometryIssueSidebar() {
  const { modelId } = useParams() as { modelId: string };
  const [pollingInterval, setPollingInterval] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { data: model } = useGetModelQuery(modelId, { pollingInterval });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { geometryIssues, selectedIssue, expandedIssueGroups } = useSelector((state: RootState) => {
    return state.geometryIssue;
  });

  // Pick the issue report for this model (prefer the post-upload detection stage).
  const modelIssue = useMemo(() => {
    if (!model?.issues?.length) return undefined;
    return model.issues.find((issue) => issue.detectionStage === "AfterUpload") ?? model.issues[0];
  }, [model]);

  const hasGeometryIssues = (modelIssue?.issueCount ?? 0) > 0;

  // Only fetch the issue report when there are issues to display.
  const { data: fetchedIssues } = useFetchModelIssuesQuery(modelIssue?.fileUrl ?? "", {
    skip: !modelIssue || !hasGeometryIssues,
  });

  useEffect(() => {
    if (fetchedIssues) {
      dispatch(setGeometryIssues(fetchedIssues));
    }
  }, [fetchedIssues, dispatch]);

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

  const geometryStatus = model?.geometryStatus ?? null;
  const isProcessing = geometryStatus === "Pending" || geometryStatus === "Processing";
  const isFailed = geometryStatus === "Failed";
  const geometryProgress = model?.geometryProgress ?? 0;

  // The initial issue report (AfterUpload) is written mid-pipeline, before the
  // repair step finishes. Reveal the sidebar as soon as it exists instead of
  // waiting for the whole pipeline (including repair) to complete.
  const hasInitialReport = Boolean(
    model?.issues?.some((issue) => issue.detectionStage === "AfterUpload"),
  );
  const isAnalyzingInitial = isProcessing && !hasInitialReport;

  const [reprocessGeometry, { isLoading: isReprocessing }] = useReprocessGeometryMutation();

  const handleReprocess = async () => {
    try {
      await reprocessGeometry(modelId).unwrap();
      toast.success("Re-running geometry processing…");
    } catch {
      toast.error("Failed to restart geometry processing");
    }
  };

  useEffect(() => {
    setPollingInterval(isProcessing ? 2000 : 0);
  }, [isProcessing]);

  const { data: compatibility } = useGetModelSimulationCompatibilityQuery(modelId, {
    // Fetch as soon as the initial report exists (repair may still be running).
    skip: !modelId || !hasInitialReport,
  });

  // The initial model can only be used if at least one simulation method
  // supports its (pre-repair) geometry. When every method is unsupported the
  // "Use Initial Model" action is pointless, so we disable it.
  const noSupportedInitialMethod = useMemo(() => {
    const methods = compatibility?.initialCompatibility?.methods ?? [];
    if (methods.length === 0) return false;
    return methods.every((m) => m.compatible !== "compatible" && m.compatible !== "warning");
  }, [compatibility]);

  const handleRepairDecision = async (decision: "accept" | "reject") => {
    try {
      await setRepairDecision({ modelId, decision }).unwrap();
      toast.success(
        decision === "accept"
          ? "Repaired geometry accepted"
          : "Repair undone, using original geometry",
      );
      navigate(`/editor/${modelId}`);
    } catch {
      toast.error("Failed to update repair decision");
    }
  };

  const handleUseInitialModel = async () => {
    setShowConfirmDialog(false);
    await handleRepairDecision("reject");
  };

  return (
    <div className="h-container flex flex-col border border-slate-300 bg-[#DCDCDC] p-1">
      <div className="h-full flex flex-col rounded-md bg-white/65 text-slate-700 font-inter p-2">
        <div className="mb-3">
          <div className="flex w-full items-center justify-between border border-slate-300 rounded-t-md bg-choras-primary px-3 py-2 text-left">
            <h4 className="text-lg font-semibold tracking-wide text-white">Initial Model</h4>
          </div>
        </div>{" "}
        <div className="min-h-0 flex flex-1 flex-col pr-1">
          {isAnalyzingInitial ? (
            <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin text-choras-primary" />
                <span className="text-sm font-semibold">Analyzing geometry…</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-choras-primary transition-all duration-500"
                  style={{ width: `${geometryProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] text-slate-500">{geometryProgress}%</p>
            </div>
          ) : isFailed && !hasInitialReport ? (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-600">Geometry processing failed</p>
              <p className="mt-1 text-[12px] text-red-500">
                The inspect &amp; repair pipeline could not complete for this model. Please try
                re-uploading the geometry.
              </p>
              <Button
                variant="outline"
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="mt-3 w-full cursor-pointer border-red-400 bg-white text-red-600 hover:bg-red-50"
              >
                {isReprocessing ? "Retrying…" : "Retry processing"}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                <PossibleSimulation stage="initial" />
                <div className="rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-2.5">
                  <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => setShowConfirmDialog(true)}
                              disabled={
                                isDeciding ||
                                repairStatus === "Rejected" ||
                                repairStatus === null ||
                                noSupportedInitialMethod
                              }
                              className="w-full cursor-pointer border border-choras-primary bg-white text-choras-primary hover:bg-choras-primary hover:text-white disabled:cursor-not-allowed"
                            >
                              {repairStatus === "Rejected"
                                ? "Using Initial Model"
                                : "Use Initial Model"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {noSupportedInitialMethod && (
                          <TooltipContent>
                            <p>
                              Can&apos;t use the initial model — none of the simulation methods
                              support its geometry.
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              {hasGeometryIssues && (
                <GeometryIssueList
                  issues={geometryIssues}
                  selectedIssue={selectedIssue}
                  expandedIssueGroups={expandedIssueGroups}
                  onToggleGroup={toggleIssueGroup}
                  onIssueClick={handleIssueClick}
                  stage="initial"
                />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Initial Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to use the initial model instead of the repaired one? Please
              make sure that your preferred simulation method is supported in the Possible
              Simulation Methods.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUseInitialModel}
              disabled={isDeciding}
              className="cursor-pointer bg-choras-primary hover:bg-choras-primary/80 text-white"
            >
              {isDeciding ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
