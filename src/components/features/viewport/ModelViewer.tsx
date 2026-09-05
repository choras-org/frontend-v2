import { Loading } from "@/components/ui/loading";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useGetModelQuery } from "@/store/modelApi";
import type { ModelViewerProps } from "@/types/modelViewport";
import { ViewportCanvas } from "./ViewportCanvas";

export function ModelViewer({
  modelId,
  simulationId,
  useClone = false,
  isRepair = false,
  showGeometrySelectionInfo = true,
  source,
}: ModelViewerProps) {
  const { data: model, isLoading, error } = useGetModelQuery(modelId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircleIcon />
          <AlertTitle>Error loading model</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loading message="Loading viewport" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <div>No model found</div>
      </div>
    );
  }

  const detectionStage =
    source === "InitialIssue"
      ? "AfterUpload"
      : source === "RepairedIssue"
        ? "AfterRepair"
        : undefined;

  const stageIssue = detectionStage
    ? model.issues?.find((issue) => issue.detectionStage === detectionStage)
    : undefined;

  // For the repaired view, wait until the repaired file actually exists.
  // Before the repair finishes there is no AfterRepair file, and showing the
  // initial model here would be misleading (it looks like nothing was fixed).
  if (source === "RepairedIssue" && !stageIssue?.modelFileUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full min-h-[300px]"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <Loading message="Repair in progress…" />
      </div>
    );
  }

  const modelUrl = detectionStage ? (stageIssue?.modelFileUrl ?? model.modelUrl) : model.modelUrl;

  // For the plain editor view (no repair stage), wait until geometry processing
  // has finished; the model file may be missing or partially written otherwise.
  const isProcessing = model.geometryStatus === "Pending" || model.geometryStatus === "Processing";
  if (!detectionStage && (isProcessing || !modelUrl)) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full min-h-[300px]"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <Loading message="Preparing geometry…" />
      </div>
    );
  }

  const cacheKey = source ? `${model.id}:${source}` : String(model.id);

  return (
    <div className="h-full" style={{ height: "calc(100vh - 4rem)" }}>
      <ViewportCanvas
        modelUrl={modelUrl}
        modelId={model.id}
        simulationId={Number(simulationId)}
        cacheKey={cacheKey}
        useClone={useClone}
        isRepair={isRepair}
        showGeometrySelectionInfo={showGeometrySelectionInfo}
      />
    </div>
  );
}
