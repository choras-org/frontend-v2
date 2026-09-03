import { useMemo, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import { useParams } from "react-router";
import { useGetSimulationsByModelIdQuery } from "@/store/simulationApi";
import { useGetModelQuery } from "@/store/modelApi";
import type { Simulation } from "@/types/simulation";
import { setCurrentModelId } from "@/store/modelSlice";
import { useModelLoader } from "./useModelLoader";

const KEY_ORDER = [
  "sim_len_type",
  "de_ir_length",
  "de_c0",
  "edt",
  "de_absorption_override",
  "de_R",
];

export function useJsonBuilder() {
  // Pull required data from store/hooks
  const { modelId, simulationId } = useParams() as { modelId: string; simulationId?: string };
  const { data: simulations } = useGetSimulationsByModelIdQuery(+modelId);
  const { data: model } = useGetModelQuery(modelId);
  const [simulation, setSimulation] = useState<Simulation | undefined>(undefined);
  const dispatch = useDispatch();
  const { loadModelFromUrl } = useModelLoader();

  useEffect(() => {
    if (simulations) {
      const sim = simulations.find((el) => el.id === Number(simulationId));
      setSimulation(sim);
    }
  }, [simulations]);

  useEffect(() => {
    if (model) {
      dispatch(setCurrentModelId(model?.id));
      loadModelFromUrl(Number(modelId), model.modelUrl).catch(console.error);
    }
  }, [model]);

  const surfaces = useSurfaces();

  const { data: materials = [] } = useGetMaterialsQuery();

  // Order simulation settings keys based on keyOrder
  type SimulationSettingValue = number | string | boolean;
  const orderSimulationSettings = useCallback(
    (settings: Record<string, SimulationSettingValue>) => {
      const ordered: Record<string, SimulationSettingValue> = {};

      // Add keys in the specified order
      KEY_ORDER.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          ordered[key] = settings[key];
        }
      });

      // Add remaining keys that are not in keyOrder
      Object.keys(settings).forEach((key) => {
        if (!KEY_ORDER.includes(key)) {
          ordered[key] = settings[key];
        }
      });

      return ordered;
    },
    [],
  );

  // Build absorption coefficients map from surfaces and materials
  const absorptionCoefficients = useMemo(() => {
    const coefficients: Record<string, string> = {};

    surfaces.forEach((surface, idx) => {
      const materialId = simulation?.layerIdByMaterialId[surface.id];
      const material = materials.find((m) => m.id === materialId);

      if (material?.absorptionCoefficients) {
        coefficients[`Surface [${idx + 1}]`] = material.absorptionCoefficients.join(", ");
      }
    });

    return coefficients;
  }, [surfaces, simulation, materials]);

  // Build sources map
  const sourcesMap = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};

    simulation?.sources.forEach((source, idx) => {
      map[`s${idx + 1}`] = [source.x, source.y, source.z];
    });

    return map;
  }, [simulation]);

  // Build receivers map
  const receiversMap = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};

    simulation?.receivers.forEach((receiver, idx) => {
      map[`r${idx + 1}`] = [receiver.x, receiver.y, receiver.z];
    });

    return map;
  }, [simulation]);

  // Build complete JSON structure
  const values = simulation?.solverSettings.simulationSettings as Record<
    string,
    SimulationSettingValue
  >;
  const buildJsonStructure = useCallback(() => {
    return {
      simulation_method: simulation?.simulationMethod,
      sources: sourcesMap,
      receivers: receiversMap,
      absorption_coefficients: absorptionCoefficients,
      simulation_settings: orderSimulationSettings(values),
    };
  }, [
    simulation,
    sourcesMap,
    receiversMap,
    absorptionCoefficients,
    values,
    orderSimulationSettings,
  ]);

  // Custom JSON stringify to format arrays horizontally
  const stringifyWithHorizontalArrays = useCallback((obj: unknown) => {
    return JSON.stringify(obj, null, 2).replace(
      /\[\s+(-?\d+\.?\d*),\s+(-?\d+\.?\d*),\s+(-?\d+\.?\d*)\s+\]/g,
      "[$1, $2, $3]",
    );
  }, []);

  // Parse absorption coefficients from JSON to surface-material mapping
  const parseAbsorptionCoefficients = useCallback(
    (coefficientsData: Record<string, string>): Record<string, number> => {
      const surfaceMaterialMap: Record<string, number> = {};

      Object.entries(coefficientsData).forEach(([key, coeffValue]) => {
        const match = key.match(/Surface \[(\d+)\]/);
        if (match) {
          const surfaceIndex = parseInt(match[1]) - 1;
          const surface = surfaces[surfaceIndex];

          if (surface) {
            const coeffArray = coeffValue.split(",").map((v) => parseFloat(v.trim()));
            const matchingMaterial = materials.find(
              (material) =>
                material.absorptionCoefficients.length === coeffArray.length &&
                material.absorptionCoefficients.every(
                  (coeff, idx) => Math.abs(coeff - coeffArray[idx]) < 0.0001,
                ),
            );

            if (matchingMaterial) {
              surfaceMaterialMap[surface.id] = matchingMaterial.id;
            }
          }
        }
      });

      return surfaceMaterialMap;
    },
    [surfaces, materials],
  );

  const exportJson = (filename: string = "settings.json") => {
    try {
      const structure = buildJsonStructure();
      const jsonStr = stringifyWithHorizontalArrays(structure);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error("Failed to export JSON", e);
      return false;
    }
  };

  return {
    buildJsonStructure,
    stringifyWithHorizontalArrays,
    parseAbsorptionCoefficients,
    exportJson,
  };
}
