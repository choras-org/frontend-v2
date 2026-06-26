export interface Model {
  createdAt: string;
  hasGeo: boolean;
  id: number;
  name: string;
  outputFileId: number;
  projectId: number;
  imagePath?: string;
  sourceFileId: number;
  updatedAt: string;
}

export interface ModelIssue {
  id: number;
  modelId: number;
  fileUrl: string;
  modelFileUrl?: string | null;
  issueCount: number;
  detectionStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDetail {
  hasGeo: boolean;
  id: number;
  modelName: string;
  modelUploadId: number;
  modelUrl: string;
  projectId: number;
  projectName: string;
  projectTag: string;
  simulationCount: number;
  repairStatus?: "Pending" | "Accepted" | "Rejected" | null;
  geometryStatus?: "Pending" | "Processing" | "Completed" | "Failed" | null;
  geometryProgress?: number | null;
  issues: ModelIssue[];
}

export type CompatibilityStatus = "compatible" | "warning" | "incompatible" | "unknown";

export interface MethodCompatibilityIssue {
  kind: string;
  label?: string | null;
  compatibility?: string | null;
  present: boolean;
}

export interface MethodCompatibility {
  simulationType: string;
  label?: string | null;
  notes?: string | null;
  compatible: CompatibilityStatus;
  issues: MethodCompatibilityIssue[];
}

export interface ModelSimulationCompatibility {
  version?: number | null;
  compatibilityLevels?: Record<string, string>;
  modelId: number;
  detectionStage: string;
  methods: MethodCompatibility[];
}
