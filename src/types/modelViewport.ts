export interface ModelViewerProps {
  modelId: string;
}

export interface ModelRendererProps {
  modelId: number;
  viewMode: "solid" | "ghosted" | "wireframe";
}

export interface ViewportCanvasProps {
  modelUrl?: string;
  modelId?: number;
}
