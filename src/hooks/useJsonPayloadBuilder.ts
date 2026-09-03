import { useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Source, Receiver } from "@/types/simulation";

// Shape of parsed JSON structure we care about
interface ParsedJsonStructure {
  simulation_method?: string;
  sources?: Record<string, [number, number, number]>;
  receivers?: Record<string, [number, number, number]>;
  simulation_settings?: Record<string, unknown>;
  absorption_coefficients?: Record<string, string>;
}

// Refactored to no-arg hook pulling data from store directly
export function useJsonPayloadBuilder() {
  const sources = useSelector((state: RootState) => state.sourceReceiver.sources);
  const receivers = useSelector((state: RootState) => state.sourceReceiver.receivers);
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  // activeSimulation already contains the simulation object per slice definition
  const simulation = activeSimulation;

  // Update sources coordinates from JSON
  const updateSourcesFromJson = useCallback(
    (sourcesData: Record<string, unknown>): Source[] => {
      return sources.map((src, idx): Source => {
        const jsonKey = `s${idx + 1}`;
        const jsonCoords = sourcesData?.[jsonKey] as unknown;

        if (Array.isArray(jsonCoords) && jsonCoords.length === 3) {
          const [x, y, z] = jsonCoords as number[];
          return {
            ...src,
            x,
            y,
            z,
          };
        }

        return src;
      });
    },
    [sources],
  );

  // Update receivers coordinates from JSON
  const updateReceiversFromJson = useCallback(
    (receiversData: Record<string, unknown>): Receiver[] => {
      return receivers.map((rcv, idx): Receiver => {
        const jsonKey = `r${idx + 1}`;
        const jsonCoords = receiversData?.[jsonKey] as unknown;

        if (Array.isArray(jsonCoords) && jsonCoords.length === 3) {
          const [x, y, z] = jsonCoords as number[];
          return {
            ...rcv,
            x,
            y,
            z,
          };
        }

        return rcv;
      });
    },
    [receivers],
  );

  // Build payload for simulation update
  const buildPayload = useCallback(
    (
      parsedData: ParsedJsonStructure,
      surfaceMaterialMap: Record<string, number>,
      hasBeenEdited: boolean,
    ) => {
      return {
        id: activeSimulation?.id || 0,
        body: {
          modelId: currentModelId || 0,
          name: simulation?.name,
          status: simulation?.status,
          hasBeenEdited,
          simulationMethod: parsedData.simulation_method,
          layerIdByMaterialId: surfaceMaterialMap,
          solverSettings: {
            simulationSettings: parsedData.simulation_settings ?? {},
          },
          sources: updateSourcesFromJson(parsedData.sources || {}),
          receivers: updateReceiversFromJson(parsedData.receivers || {}),
        },
      };
    },
    [
      activeSimulation?.id,
      currentModelId,
      simulation?.name,
      simulation?.status,
      updateSourcesFromJson,
      updateReceiversFromJson,
    ],
  );

  return {
    buildPayload,
    updateSourcesFromJson,
    updateReceiversFromJson,
  };
}
