import * as THREE from "three";
import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.module.js";
import type { RhinoLayerData, RhinoObjectAttribute } from "@/types/layer";
import type { RhinoDocument } from "@/types/file";
import { RHINO3DM_PATH } from "@/constants";

export async function parseFileAsRhinoDoc(fileData: ArrayBuffer): Promise<RhinoDocument> {
  try {
    const rhino = await rhino3dm();
    const rhinoDoc = rhino.File3dm.fromByteArray(new Uint8Array(fileData));

    if (!rhinoDoc) {
      throw new Error("Failed to parse 3dm file");
    }

    rhinoDoc.settings().pageUnitSystem = rhino.UnitSystem.Meters;

    return rhinoDoc;
  } catch (error) {
    throw new Error(
      `Failed to parse rhino document: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function parseFileAsThreeObject(fileData: ArrayBuffer): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    try {
      const loader = new Rhino3dmLoader();
      loader.setLibraryPath(RHINO3DM_PATH);

      loader.parse(
        fileData,
        (object3D: THREE.Object3D) => {
          if (!object3D) {
            reject(new Error("Failed to parse 3dm file"));
            return;
          }

          object3D.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              configureMeshMaterial(child);
              ensureLayerIndex(child);
            }
          });

          resolve(object3D);
        },
        (error: ErrorEvent) => {
          reject(new Error(`Failed to parse 3D model: ${error}`));
        },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      reject(new Error(`Failed to initialize 3DM loader: ${errorMessage}`));
    }
  });
}

function configureMeshMaterial(mesh: THREE.Mesh): void {
  const createStandardMaterial = (color: number) =>
    new THREE.MeshStandardMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: true,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
    });

  if (!mesh.material) {
    mesh.material = createStandardMaterial(0xcccccc).clone();
  } else {
    let color = 0xcccccc;
    if (
      mesh.material instanceof THREE.MeshStandardMaterial ||
      mesh.material instanceof THREE.MeshBasicMaterial
    ) {
      color = mesh.material.color.getHex();

      if (color === 0x000000 || color < 0x111111) {
        color = 0xcccccc;
      }
    }

    mesh.material = createStandardMaterial(color).clone();
  }
}

function ensureLayerIndex(mesh: THREE.Mesh): void {
  if (!mesh.userData.layerIndex) {
    mesh.userData.layerIndex = 0;
  }
}

export function extractLayerInfo(rhinoDoc: RhinoDocument): Array<RhinoLayerData> {
  const layers: Array<RhinoLayerData> = [];

  try {
    const rhinoLayers = rhinoDoc.layers();
    const layerCount = rhinoLayers.count;

    for (let i = 0; i < layerCount; i++) {
      const layer = rhinoLayers.get(i);

      layers.push({
        index: layer.index,
        name: layer.name || `Layer_${layer.index}`,
        color: `#${layer.color.r.toString(16).padStart(2, "0")}${layer.color.g.toString(16).padStart(2, "0")}${layer.color.b.toString(16).padStart(2, "0")}`,
        visible: layer.visible,
        fullPath: layer.fullPath || layer.name || `Layer_${layer.index}`,
        parentIndex: layer.parentLayerIndex || -1,
      });
    }
  } catch (error) {
    console.warn("Failed to extract layers from Rhino document:", error);
  }

  return layers;
}

export function extractObjectAttributes(rhinoDoc: RhinoDocument): Array<RhinoObjectAttribute> {
  const attributes: Array<RhinoObjectAttribute> = [];

  try {
    const objects = rhinoDoc.objects();
    const objectCount = objects.count;

    for (let i = 0; i < objectCount; i++) {
      const rhinoObject = objects.get(i);
      const objectAttributes = rhinoObject.attributes();

      attributes.push({
        id: rhinoObject.id || `object_${i}`,
        layerIndex: objectAttributes.layerIndex || 0,
        name: objectAttributes.name || `Object_${rhinoObject.id || i}`,
      });
    }
  } catch (error) {
    console.warn("Failed to extract object attributes:", error);
  }

  return attributes;
}
