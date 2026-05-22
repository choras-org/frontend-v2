import * as THREE from "three";

export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  meshes: THREE.Mesh[];
  material?: THREE.Material;
  color?: string;
  children?: LayerInfo[];
}

export interface RhinoFileData {
  modelId: number;
  fileName: string;
  rawData: ArrayBuffer;
  object3D: THREE.Object3D;
  layers: LayerInfo[];
  loadedAt: number;
}

export interface LayerState {
  rhinoFiles: Record<number, RhinoFileData>;
  currentModelId: number | null;
  loading: boolean;
  error: string | null;
}

export interface RhinoLayerData {
  index: number;
  name: string;
  color: string;
  visible: boolean;
  fullPath: string;
  parentIndex: number;
}

export interface RhinoObjectAttribute {
  id: string;
  layerIndex: number;
  name: string;
}
