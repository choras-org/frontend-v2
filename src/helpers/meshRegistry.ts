import * as THREE from "three";

/**
 * Module-level registry that maps mesh UUIDs to their live `THREE.Mesh`
 * instances. Redux only stores serializable data (UUIDs + plain values), while
 * the actual (non-serializable) mesh objects live here. Consumers resolve a
 * mesh from a UUID via `meshRegistry.get(uuid)`.
 */
const registry = new Map<string, THREE.Mesh>();

export const meshRegistry = {
  register(mesh: THREE.Mesh): void {
    registry.set(mesh.uuid, mesh);
  },

  registerMany(meshes: THREE.Mesh[]): void {
    meshes.forEach((mesh) => registry.set(mesh.uuid, mesh));
  },

  get(uuid: string): THREE.Mesh | undefined {
    return registry.get(uuid);
  },

  has(uuid: string): boolean {
    return registry.has(uuid);
  },

  unregister(uuid: string): void {
    registry.delete(uuid);
  },

  clear(): void {
    registry.clear();
  },
};
