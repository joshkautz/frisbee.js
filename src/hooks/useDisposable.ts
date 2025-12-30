/**
 * Hook for automatic disposal of Three.js resources.
 *
 * Ensures proper cleanup of materials, geometries, and other
 * disposable resources when components unmount.
 *
 * @module hooks/useDisposable
 */

import { useEffect, type DependencyList } from "react";

/**
 * Interface for any resource that has a dispose method.
 */
interface Disposable {
  dispose(): void;
}

/**
 * Automatically dispose a resource when component unmounts or dependencies change.
 *
 * Replaces the common pattern:
 * ```ts
 * useEffect(() => {
 *   return () => material.dispose();
 * }, [material]);
 * ```
 *
 * @param resource - The disposable resource (material, geometry, etc.)
 * @param deps - Dependency array (like useEffect)
 *
 * @example
 * const material = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);
 * useDisposable(material, [material]);
 *
 * @example
 * // For multiple resources
 * const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
 * const material = useMemo(() => new THREE.MeshStandardMaterial(), []);
 * useDisposable(geometry, [geometry]);
 * useDisposable(material, [material]);
 */
export function useDisposable<T extends Disposable>(
  resource: T,
  deps: DependencyList
): void {
  useEffect(() => {
    return () => {
      resource.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Automatically dispose multiple resources when component unmounts.
 *
 * @param resources - Array of disposable resources
 * @param deps - Dependency array
 *
 * @example
 * const materials = useMemo(() => ({
 *   body: new THREE.MeshStandardMaterial({ color: bodyColor }),
 *   accent: new THREE.MeshStandardMaterial({ color: accentColor }),
 * }), [bodyColor, accentColor]);
 *
 * useDisposableMany(Object.values(materials), [materials]);
 */
export function useDisposableMany<T extends Disposable>(
  resources: T[],
  deps: DependencyList
): void {
  useEffect(() => {
    return () => {
      resources.forEach((r) => r.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
