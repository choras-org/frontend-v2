export interface Model {
  createdAt: string;
  hasGeo: boolean;
  id: number;
  name: string;
  outputFileId: number;
  projectId: number;
  sourceFileId: number;
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
}
