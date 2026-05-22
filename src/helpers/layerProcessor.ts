import * as THREE from "three";
import type { LayerInfo, RhinoLayerData } from "@/types/layer";
import { extractLayerInfo } from "./rhinoParser";
import type { RhinoDocument } from "@/types/file";

export function extractLayersFromRhinoDoc(rhinoDoc: RhinoDocument): RhinoLayerData[] {
  return extractLayerInfo(rhinoDoc);
}

export async function createLayerStructure(
  object3D: THREE.Object3D,
  rhinoDoc: RhinoDocument,
): Promise<LayerInfo[]> {
  const rhinoLayers = extractLayersFromRhinoDoc(rhinoDoc);
  const layerMap = new Map<number, LayerInfo>();

  rhinoLayers.forEach((rhinoLayer) => {
    const layerInfo: LayerInfo = {
      id: `layer_${rhinoLayer.index}`,
      name: rhinoLayer.name,
      visible: rhinoLayer.visible,
      meshes: [],
      color: rhinoLayer.color,
      children: [],
    };
    layerMap.set(rhinoLayer.index, layerInfo);
  });

  object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.layerIndex !== undefined) {
      const layerIndex = child.userData.layerIndex;
      const layer = layerMap.get(layerIndex);
      if (layer) {
        layer.meshes.push(child);

        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.setHex(parseInt(layer.color?.replace("#", "") || "ffffff", 16));
        }
      }
    }
  });

  const rootLayers: LayerInfo[] = [];
  const childLayers: LayerInfo[] = [];

  rhinoLayers.forEach((rhinoLayer) => {
    const layer = layerMap.get(rhinoLayer.index);
    if (layer) {
      if (rhinoLayer.parentIndex >= 0) {
        childLayers.push(layer);
      } else {
        rootLayers.push(layer);
      }
    }
  });

  childLayers.forEach((childLayer) => {
    const rhinoLayer = rhinoLayers.find((l) => l.name === childLayer.name);
    if (rhinoLayer) {
      const parentLayer = layerMap.get(rhinoLayer.parentIndex);
      if (parentLayer) {
        parentLayer.children = parentLayer.children || [];
        parentLayer.children.push(childLayer);
      }
    }
  });

  return rootLayers;
}

export function updateLayerVisibility(
  layers: LayerInfo[],
  layerId: string,
  visible: boolean,
): void {
  const updateLayer = (layer: LayerInfo) => {
    if (layer.id === layerId) {
      layer.visible = visible;
      layer.meshes.forEach((mesh) => {
        mesh.visible = visible;
      });
      return true;
    }

    if (layer.children) {
      for (const child of layer.children) {
        if (updateLayer(child)) {
          return true;
        }
      }
    }

    return false;
  };

  layers.forEach(updateLayer);
}

export function getAllMeshesFromLayer(layer: LayerInfo): THREE.Mesh[] {
  let allMeshes = [...layer.meshes];

  if (layer.children) {
    layer.children.forEach((child) => {
      allMeshes = allMeshes.concat(getAllMeshesFromLayer(child));
    });
  }

  return allMeshes;
}

export function applyMaterialToLayer(layer: LayerInfo, material: THREE.Material): void {
  layer.meshes.forEach((mesh) => {
    mesh.material = material;
  });

  if (layer.children) {
    layer.children.forEach((child) => {
      applyMaterialToLayer(child, material);
    });
  }
}

export function createWireframeForLayer(layer: LayerInfo): THREE.Group {
  const wireframeGroup = new THREE.Group();
  wireframeGroup.name = `${layer.name}_wireframe`;

  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: layer.color || "#ffffff",
    transparent: true,
    opacity: 0.5,
  });

  layer.meshes.forEach((mesh) => {
    if (mesh.geometry) {
      const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
      const wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

      wireframeMesh.position.copy(mesh.position);
      wireframeMesh.rotation.copy(mesh.rotation);
      wireframeMesh.scale.copy(mesh.scale);

      wireframeGroup.add(wireframeMesh);
    }
  });

  return wireframeGroup;
}

export function createEdgeOutlineForLayer(
  layer: LayerInfo,
  thresholdAngle: number = 40,
): THREE.Group {
  const outlineGroup = new THREE.Group();
  outlineGroup.name = `${layer.name}_edges`;

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: layer.color || "#000000",
    transparent: false,
    opacity: 1.0,
    linewidth: 2,
  });

  layer.meshes.forEach((mesh) => {
    if (mesh.geometry) {
      const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
      const edgesMesh = new THREE.LineSegments(edgesGeometry, outlineMaterial);

      edgesMesh.position.copy(mesh.position);
      edgesMesh.rotation.copy(mesh.rotation);
      edgesMesh.scale.copy(mesh.scale);

      edgesMesh.userData.originalMesh = mesh;
      edgesMesh.name = `${mesh.name || "mesh"}_edges`;

      outlineGroup.add(edgesMesh);
    }
  });

  return outlineGroup;
}

export function createEdgeOutlineForObject3D(
  object3D: THREE.Object3D,
  thresholdAngle: number = 40,
): THREE.Group {
  const outlineGroup = new THREE.Group();
  outlineGroup.name = "model_edges";

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: "#999999",
    transparent: false,
    opacity: 0.8,
    linewidth: 2,
  });

  object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const edgesGeometry = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
      const edgesMesh = new THREE.LineSegments(edgesGeometry, outlineMaterial);

      edgesMesh.position.copy(child.position);
      edgesMesh.rotation.copy(child.rotation);
      edgesMesh.scale.copy(child.scale);

      edgesMesh.userData.originalMesh = child;
      edgesMesh.name = `${child.name || "mesh"}_edges`;

      outlineGroup.add(edgesMesh);
    }
  });

  return outlineGroup;
}
