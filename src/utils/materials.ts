/**
 * Material factory with global caching.
 *
 * Provides centralized material management for Three.js materials,
 * including caching for shared materials and automatic HMR cleanup.
 *
 * @module utils/materials
 */

import * as THREE from "three";
import { registerDisposable } from "@/ecs";

/** Cache for shared materials by key */
const materialCache = new Map<string, THREE.Material>();

/**
 * Get or create a MeshStandardMaterial with caching.
 *
 * Materials are cached by key and reused across components.
 * Automatically registered for HMR disposal.
 *
 * @param key - Unique identifier for this material
 * @param options - MeshStandardMaterial parameters
 * @returns Cached or newly created material
 *
 * @example
 * const roadMaterial = getStandardMaterial("road", { color: 0x333333 });
 */
export function getStandardMaterial(
  key: string,
  options: THREE.MeshStandardMaterialParameters
): THREE.MeshStandardMaterial {
  const cacheKey = `standard:${key}`;

  if (!materialCache.has(cacheKey)) {
    const material = new THREE.MeshStandardMaterial(options);
    materialCache.set(cacheKey, material);
    registerDisposable(material);
  }

  return materialCache.get(cacheKey) as THREE.MeshStandardMaterial;
}

/**
 * Get or create a MeshBasicMaterial with caching.
 *
 * @param key - Unique identifier for this material
 * @param options - MeshBasicMaterial parameters
 * @returns Cached or newly created material
 *
 * @example
 * const lineMaterial = getBasicMaterial("centerLine", { color: 0xffffff });
 */
export function getBasicMaterial(
  key: string,
  options: THREE.MeshBasicMaterialParameters
): THREE.MeshBasicMaterial {
  const cacheKey = `basic:${key}`;

  if (!materialCache.has(cacheKey)) {
    const material = new THREE.MeshBasicMaterial(options);
    materialCache.set(cacheKey, material);
    registerDisposable(material);
  }

  return materialCache.get(cacheKey) as THREE.MeshBasicMaterial;
}

/**
 * Get or create a MeshPhongMaterial with caching.
 *
 * @param key - Unique identifier for this material
 * @param options - MeshPhongMaterial parameters
 * @returns Cached or newly created material
 */
export function getPhongMaterial(
  key: string,
  options: THREE.MeshPhongMaterialParameters
): THREE.MeshPhongMaterial {
  const cacheKey = `phong:${key}`;

  if (!materialCache.has(cacheKey)) {
    const material = new THREE.MeshPhongMaterial(options);
    materialCache.set(cacheKey, material);
    registerDisposable(material);
  }

  return materialCache.get(cacheKey) as THREE.MeshPhongMaterial;
}

/**
 * Create a unique material (not cached).
 * Use when you need per-instance materials that shouldn't be shared.
 *
 * @param MaterialClass - Material constructor
 * @param options - Material parameters
 * @returns Newly created material (registered for disposal)
 *
 * @example
 * const uniqueMaterial = createUniqueMaterial(
 *   THREE.MeshStandardMaterial,
 *   { color: playerColor }
 * );
 */
export function createUniqueMaterial<
  T extends THREE.Material,
  P extends object,
>(MaterialClass: new (params: P) => T, options: P): T {
  const material = new MaterialClass(options);
  registerDisposable(material);
  return material;
}

/**
 * Check if a material is cached.
 *
 * @param key - Material cache key
 * @param type - Material type prefix (standard, basic, phong)
 * @returns True if material exists in cache
 */
export function hasCachedMaterial(
  key: string,
  type: "standard" | "basic" | "phong" = "standard"
): boolean {
  return materialCache.has(`${type}:${key}`);
}

/**
 * Get the number of cached materials.
 * Useful for debugging and monitoring.
 *
 * @returns Number of materials in cache
 */
export function getCacheSize(): number {
  return materialCache.size;
}

/**
 * Dispose all cached materials and clear the cache.
 * Called during HMR cleanup or testing.
 */
export function disposeMaterialCache(): void {
  materialCache.forEach((material) => {
    material.dispose();
  });
  materialCache.clear();
}
