export type ModelViewerSource = "InitialIssue" | "RepairedIssue";

export interface ModelViewerProps {
  modelId: string;
  useClone?: boolean;
  isRepair?: boolean;
  showGeometrySelectionInfo?: boolean;
  source?: ModelViewerSource;
}

export interface ModelRendererProps {
  modelId: number;
  cacheKey?: string;
  viewMode: "solid" | "ghosted" | "wireframe";
  useClone?: boolean;
}

export interface ViewportCanvasProps {
  modelUrl?: string;
  modelId?: number;
  cacheKey?: string;
  useClone?: boolean;
  isRepair?: boolean;
  showGeometrySelectionInfo?: boolean;
}
