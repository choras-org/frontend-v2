declare module "cdt2d" {
  interface CDT2DOptions {
    delaunay?: boolean;
    interior?: boolean;
    exterior?: boolean;
    infinity?: boolean;
  }

  /**
   * Constrained Delaunay triangulation of a 2D point set.
   * Returns triangles as index triples referencing `points`.
   */
  export default function cdt2d(
    points: number[][],
    edges?: number[][],
    options?: CDT2DOptions,
  ): [number, number, number][];
}
