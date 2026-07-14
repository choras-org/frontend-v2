import GeometryIssueSidebar from "@/components/features/GeometryIssueSidebar";
import GeometryRepairSidebar from "@/components/features/GeometryRepairSidebar";
import { ModelViewer } from "@/components/features/viewport/ModelViewer";
import { AppLayout } from "@/components/ui/app-layout";
import { useParams } from "react-router";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { clearGeometryIssues, clearRemainingIssues } from "@/store/geometryIssueSlice";

export function GeometryRepairPage() {
  const { modelId } = useParams() as { modelId: string };
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(clearGeometryIssues());
      dispatch(clearRemainingIssues());
    };
  }, [dispatch]);

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
