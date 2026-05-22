import { Loading } from "@/components/ui/loading";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useGetModelQuery } from "@/store/modelApi";
import type { ModelViewerProps } from "@/types/modelViewport";
import { ViewportCanvas } from "./ViewportCanvas";

export function ModelViewer({ modelId }: ModelViewerProps) {
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

  return (
    <div className="h-full" style={{ height: "calc(100vh - 4rem)" }}>
      <ViewportCanvas modelUrl={model.modelUrl} modelId={model.id} />
    </div>
  );
}
