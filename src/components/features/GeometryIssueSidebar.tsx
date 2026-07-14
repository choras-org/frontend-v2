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
  useSetRepairDecisionMutation,
} from "@/store/modelApi";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import type { RootState } from "@/store";
import { Button } from "../ui/button";
import { GeometryIssueList } from "./GeometryIssueList";
import { PossibleSimulation } from "./PossibleSimulation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function GeometryIssueSidebar() {
  const { modelId } = useParams() as { modelId: string };
  const { data: model } = useGetModelQuery(modelId);
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

  const { data: compatibility } = useGetModelSimulationCompatibilityQuery(modelId, {
    skip: !modelId,
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

  return (
    <div className="h-container flex flex-col border border-slate-300 bg-[#DCDCDC] p-1">
      <div className="h-full flex flex-col rounded-md bg-white/65 text-slate-700 font-inter p-2">
        <div className="mb-3">
          <div className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-left">
            <h4 className="text-lg font-semibold tracking-wide text-choras-primary">
              Initial Model
            </h4>
          </div>
        </div>{" "}
        <div className="min-h-0 flex flex-1 flex-col pr-1">
          <div className="mb-4 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
            <PossibleSimulation stage="initial" />
            <div className="rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-2.5">
              <div className="mx-auto mt-2 flex w-full max-w-md justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-full">
                        <Button
                          onClick={() => handleRepairDecision("reject")}
                          disabled={
                            isDeciding ||
                            repairStatus === "Rejected" ||
                            repairStatus === null ||
                            noSupportedInitialMethod
                          }
                          className="w-full cursor-pointer border-red-400 bg-red-400 text-white hover:bg-red-500 hover:text-white disabled:cursor-not-allowed"
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
                          Can&apos;t use the initial model — none of the simulation methods support
                          its geometry.
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
