import GeometryIssueSidebar from "@/components/features/GeometryIssueSidebar";
import GeometryRepairSidebar from "@/components/features/GeometryRepairSidebar";
import { ModelViewer } from "@/components/features/viewport/ModelViewer";
import { AppLayout } from "@/components/ui/app-layout";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { OctagonAlert } from "lucide-react";
import { toast } from "sonner";
import { clearGeometryIssues, clearRemainingIssues } from "@/store/geometryIssueSlice";
import { useGetModelQuery } from "@/store/modelApi";
import type { RootState } from "@/store";

export function GeometryRepairPage() {
  const { modelId } = useParams() as { modelId: string };
  const dispatch = useDispatch();

  const { data: model } = useGetModelQuery(modelId);
  const selectedMethod = useSelector(
    (state: RootState) => state.simulationSettings.selectedSimulationMethod,
  );

  const geometryStatus = model?.geometryStatus ?? null;
  // Treat "model not yet loaded" as processing so we don't toast prematurely
  // while the query resolves (which would otherwise fire once before the status
  // is known and again after the repair completes).
  const isProcessing = !model || geometryStatus === "Pending" || geometryStatus === "Processing";

  // Track the last method we toasted for so a single selection never toasts
  // twice (e.g. from transient status transitions or StrictMode remounts).
  const lastToastedMethodId = useRef<string | number | null>(null);

  useEffect(() => {
    return () => {
      dispatch(clearGeometryIssues());
      dispatch(clearRemainingIssues());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedMethod && !isProcessing && lastToastedMethodId.current !== selectedMethod.id) {
      lastToastedMethodId.current = selectedMethod.id;
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
  }, [selectedMethod?.id, isProcessing]);

  return (
    <AppLayout
      title="Repair Page"
      headerVariant="light"
      sidebar={<GeometryIssueSidebar />}
      rightSidebar={<GeometryRepairSidebar />}
      showLeftSidebarToggle={true}
      showRightSidebarToggle={true}
    >
      <div className="h-full w-full flex">
        <div className="flex-1 h-full">
          <ModelViewer modelId={modelId} showGeometrySelectionInfo={false} source="InitialIssue" />
        </div>
        <div className="w-1 bg-border h-full" />
        <div className="flex-1 h-full">
          <ModelViewer
            modelId={modelId}
            useClone
            isRepair={true}
            showGeometrySelectionInfo={false}
            source="RepairedIssue"
          />
        </div>
      </div>
    </AppLayout>
  );
}
