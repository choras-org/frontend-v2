export interface ModelViewerProps {
  modelId: string;
  simulationId: string;
}

export interface ModelRendererProps {
  modelId: number;
  viewMode: "solid" | "ghosted" | "wireframe";
}

export interface ViewportCanvasProps {
  modelUrl?: string;
  modelId?: number;
  simulationId?: number;
}
