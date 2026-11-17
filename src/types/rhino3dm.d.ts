// rhino3dm only ships types for "rhino3dm", and they leave out the Emscripten config.
// We import the ES module file, because Vite can't pre-bundle the default (CommonJS) entry.
declare module "rhino3dm/rhino3dm.module.js" {
  import type { RhinoModule } from "rhino3dm";

  export default function rhino3dm(config?: {
    locateFile?: (path: string) => string;
  }): Promise<RhinoModule>;
}
