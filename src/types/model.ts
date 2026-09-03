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

export interface ExampleModel {
  description: string;
  fileName: string;
  filePath: string;
  id: string;
  modelUrl: string;
  name: string;
  thumbnailUrl: string;
}
