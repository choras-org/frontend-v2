import * as THREE from "three";
import type { RhinoFileData } from "@/types/layer";
import { downloadAndExtractFiles } from "./fileExtractor";
import { parseFileAsRhinoDoc, parseFileAsThreeObject } from "./rhinoParser";
import { createLayerStructure } from "./layerProcessor";

export async function processModelFromUrl(
  modelId: number,
  modelUrl: string,
): Promise<RhinoFileData> {
  try {
    const extractedFiles = await downloadAndExtractFiles(modelUrl, ".3dm");

    if (extractedFiles.length === 0) {
      throw new Error("No 3DM files found in the archive");
    }

    const firstFile = extractedFiles[0];

    const [rhinoDoc, object3D] = await Promise.all([
      parseFileAsRhinoDoc(firstFile.data.slice()),
      parseFileAsThreeObject(firstFile.data.slice()),
    ]);

    const layers = await createLayerStructure(object3D, rhinoDoc);

    rhinoDoc.delete();

    const rhinoFileData: RhinoFileData = {
      modelId,
      fileName: firstFile.name,
      rawData: firstFile.data,
      object3D,
      layers,
      loadedAt: Date.now(),
    };

    return rhinoFileData;
  } catch (error) {
    throw new Error(
      `Failed to process model: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function processModelFromData(
  modelId: number,
  fileName: string,
  fileData: ArrayBuffer,
): Promise<RhinoFileData> {
  try {
    const [rhinoDoc, object3D] = await Promise.all([
      parseFileAsRhinoDoc(fileData.slice()),
      parseFileAsThreeObject(fileData.slice()),
    ]);

    const layers = await createLayerStructure(object3D, rhinoDoc);

    rhinoDoc.delete();

    const rhinoFileData: RhinoFileData = {
      modelId,
      fileName,
      rawData: fileData,
      object3D,
      layers,
      loadedAt: Date.now(),
    };

    return rhinoFileData;
  } catch (error) {
    throw new Error(
      `Failed to process model data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function calculateModelBounds(object3D: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  box.setFromObject(object3D);
  return box;
}

export function centerModelAtOrigin(object3D: THREE.Object3D): THREE.Vector3 {
  const box = calculateModelBounds(object3D);
  const center = box.getCenter(new THREE.Vector3());

  object3D.position.sub(center);

  return center;
}

export function scaleModelToFit(object3D: THREE.Object3D, targetSize: number = 100): number {
  const box = calculateModelBounds(object3D);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  if (maxDimension > targetSize) {
    const scaleFactor = targetSize / maxDimension;
    object3D.scale.multiplyScalar(scaleFactor);
    return scaleFactor;
  }

  return 1;
}

export function optimizeModelForRendering(
  rhinoFileData: RhinoFileData,
  targetSize: number = 100,
): RhinoFileData {
  const scaleFactor = scaleModelToFit(rhinoFileData.object3D, targetSize);

  rhinoFileData.object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      child.geometry.computeVertexNormals();
      child.geometry.computeBoundingSphere();
    }
  });

  rhinoFileData.object3D.userData.optimization = {
    scaleFactor,
    optimizedAt: Date.now(),
  };

  return rhinoFileData;
}
