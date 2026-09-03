import type { RootState } from "@/store";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import { useGetSimulationByIdQuery } from "@/store/simulationApi";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSurfaces } from "./useSurfaces";
import { calculateAverageAbsorption, getAbsorptionColor } from "@/helpers/colorGradient";
import { useMeshHighlight } from "./useMeshHighlight";

export function useApplySurfaceColors() {
  const surfaces = useSurfaces();
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const { setMeshBaseColor } = useMeshHighlight();
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: simulation } = useGetSimulationByIdQuery(activeSimulation?.id ?? 0, {
    skip: !activeSimulation?.id,
  });

  useEffect(() => {
    applySurfaceColors();
  }, [simulation?.layerIdByMaterialId, surfaces, materials, setMeshBaseColor]);

  function applySurfaceColors() {
    if (simulation?.layerIdByMaterialId && surfaces.length > 0 && materials.length > 0) {
      Object.entries(simulation.layerIdByMaterialId).forEach(([surfaceId, materialId]) => {
        const surface = surfaces.find((s) => s.id === surfaceId);
        const material = materials.find((m) => m.id === materialId);

        if (surface?.mesh && material?.absorptionCoefficients) {
          const avgAbsorption = calculateAverageAbsorption(material.absorptionCoefficients);
          const absorptionColor = getAbsorptionColor(avgAbsorption);
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });
    }
  }

  return { applySurfaceColors };
}
