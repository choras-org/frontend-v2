export interface ExtractedFile {
  name: string;
  data: ArrayBuffer;
}

export interface RhinoDocument {
  layers(): {
    count: number;
    get(index: number): {
      index: number;
      name: string;
      color: { r: number; g: number; b: number };
      visible: boolean;
      fullPath: string;
      parentLayerIndex: number;
    };
  };
  objects(): {
    count: number;
    get(index: number): {
      id: string;
      attributes(): {
        layerIndex: number;
        name: string;
      };
    };
  };
  delete(): void;
}
