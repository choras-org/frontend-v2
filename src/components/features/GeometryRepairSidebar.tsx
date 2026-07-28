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
  useGetModelSimulationCompatibilityQuery,
  useLazyDownloadModelQuery,
  useReprocessGeometryMutation,
  useSetRepairDecisionMutation,
} from "@/store/modelApi";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
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
import { downloadFile } from "@/helpers/file";

export default function GeometryRepairSidebar() {
  const { modelId } = useParams() as { modelId: string };
  const navigate = useNavigate();
  // Poll while the background geometry pipeline is still running so the sidebar
  // refreshes automatically once issues + repair become available.
  const [pollingInterval, setPollingInterval] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  const hasAnyRemainingIssues = useMemo(() => {
    if (!remainingIssues) return false;
    return Object.values(remainingIssues).some((arr) => Array.isArray(arr) && arr.length > 0);
  }, [remainingIssues]);

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

  const { data: compatibility } = useGetModelSimulationCompatibilityQuery(modelId, {
    // Wait until the geometry pipeline has finished: while it is still
    // Pending/Processing the AfterRepair report does not exist yet and the
    // backend would report every method as "unknown".
    skip: !modelId || model?.geometryStatus === "Pending" || model?.geometryStatus === "Processing",
    // The Issue sidebar shares this cache and may have fetched a partial
    // (repair-still-running) result, so force a fresh fetch when this query
    // becomes active after the pipeline completes.
    refetchOnMountOrArgChange: true,
  });

  // The repaired model can only be accepted if at least one simulation method
  // supports its geometry. When every method is unsupported the "Accept
  // Repaired Model" action is pointless, so we disable it.
  const noSupportedRepairedMethod = useMemo(() => {
    const methods = compatibility?.repairedCompatibility?.methods ?? [];
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

  const handleAcceptRepair = async () => {
    setShowConfirmDialog(false);
    await handleRepairDecision("accept");
  };

  const geometryStatus = model?.geometryStatus ?? null;
  const isProcessing = geometryStatus === "Pending" || geometryStatus === "Processing";
  const isFailed = geometryStatus === "Failed";
  const geometryProgress = model?.geometryProgress ?? 0;

  const [reprocessGeometry, { isLoading: isReprocessing }] = useReprocessGeometryMutation();

  const [downloadModel, { isFetching: isDownloading }] = useLazyDownloadModelQuery();

  const handleDownloadFixedModel = async () => {
    try {
      const blob = await downloadModel({ modelId, variant: "repaired" }).unwrap();
      downloadFile(blob, `${model?.modelName ?? "model"}_repaired.obj`);
    } catch {
      toast.error("Failed to download the model");
    }
  };

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

  return (
    <div className="h-container flex flex-col border border-slate-300 bg-[#DCDCDC] p-1">
      <div className="h-full flex flex-col rounded-md bg-white/65 text-slate-700 font-inter">
        <div className="mb-3">
          <div className="flex w-full items-center justify-between border border-slate-300 rounded-t-md bg-choras-primary px-3 py-2 text-left">
            <h4 className="text-lg font-semibold tracking-wide text-white">Repaired Model</h4>
          </div>
        </div>
        <div className="min-h-0 flex flex-1 flex-col p-2">
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
            <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
              <PossibleSimulation stage="repaired" />
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
                              repairStatus === "Accepted" ||
                              repairStatus === null ||
                              noSupportedRepairedMethod
                            }
                            className="w-full font-semibold cursor-pointer border-green-500 bg-green-500 text-white hover:bg-green-400 hover:text-white disabled:cursor-not-allowed"
                          >
                            {repairStatus === "Accepted"
                              ? "Repair Accepted"
                              : "Accept Repaired Model"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {noSupportedRepairedMethod && (
                        <TooltipContent>
                          <p>
                            Can&apos;t accept the repaired model &mdash; none of the simulation
                            methods support its geometry.
                            <br />
                            Please fixed the remaining issues in your modelling tools.
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                  <Button
                    variant="outline"
                    onClick={handleDownloadFixedModel}
                    disabled={isDownloading || repairStatus === null}
                    className="w-full cursor-pointer border border-choras-primary bg-white text-choras-primary hover:bg-choras-primary hover:text-white disabled:cursor-not-allowed"
                  >
                    {isDownloading ? "Downloading…" : "Download Repaired Model"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasAnyRemainingIssues && (
            <GeometryIssueList
              issues={remainingIssues}
              selectedIssue={selectedIssue}
              expandedIssueGroups={expandedIssueGroups}
              onToggleGroup={toggleIssueGroup}
              onIssueClick={handleIssueClick}
              label="Remaining Issues"
              stage="repaired"
            />
          )}
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Repaired Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept the repaired model? Please make sure that your
              preferred simulation method is supported in the Possible Simulation Methods.
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
              onClick={handleAcceptRepair}
              disabled={isDeciding}
              className="cursor-pointer bg-green-500 hover:bg-green-600 text-white"
            >
              {isDeciding ? "Accepting..." : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
