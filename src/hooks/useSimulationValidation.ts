import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useSurfaces } from "./useSurfaces";
import { useGetSimulationByIdQuery } from "@/store/simulationApi";
import { validateSourceOrReceiver, getModelBounds } from "@/helpers/sourceReceiverValidation";
import { useEffect, useState } from "react";
import { setErrors as setSimulationSettingsErrors } from "@/store/simulationSettingsSlice";
import { useGetSimulationSettingsQuery } from "@/store/simulationSettingsApi";

export interface ValidationError {
  type: "sources" | "receivers" | "materials" | "sourceValidity" | "receiverValidity";
  message: string;
  navigationTarget: "sources" | "surfaces";
  highlightTarget?: string;
}

export function useSimulationValidation() {
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const surfaces = useSurfaces();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);
  const { errors: simulationSettingsErrors, selectedMethodType } = useSelector(
    (state: RootState) => state.simulationSettings,
  );
  const dispatch = useDispatch();
  const { data: settingsData } = useGetSimulationSettingsQuery(selectedMethodType);
  const { data: simulation, isLoading: simulationLoading } = useGetSimulationByIdQuery(
    activeSimulation?.id ?? 0,
    {
      skip: !activeSimulation?.id,
    },
  );

  useEffect(() => {
    const { isValid, errors: validationErrors } = validateSimulation();
    setIsValid(isValid);
    setErrors(validationErrors);
  }, [activeSimulation, surfaces]);

  // Get the current model's Object3D for raycaster validation
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const currentModel = useSelector((state: RootState) =>
    currentModelId ? state.model.rhinoFiles[currentModelId] : null,
  );
  const modelObject3D = currentModel?.object3D || null;

  const validateSimulation = (): { isValid: boolean; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];

    if (simulationLoading || !simulation) {
      return {
        isValid: true,
        errors: [],
      };
    }

    if (!simulation.sources || simulation.sources.length === 0) {
      errors.push({
        type: "sources",
        message: "At least one source is required",
        navigationTarget: "sources",
        highlightTarget: "add-source-button",
      });
    }

    if (!simulation.receivers || simulation.receivers.length === 0) {
      errors.push({
        type: "receivers",
        message: "At least one receiver is required",
        navigationTarget: "sources",
        highlightTarget: "add-receiver-button",
      });
    }

    // Validate sources using raycaster
    if (simulation.sources && simulation.sources.length > 0) {
      const modelBounds = getModelBounds(surfaces);
      const hasInvalidSource = simulation.sources.some((source) => {
        const validation = validateSourceOrReceiver(
          { x: source.x, y: source.y, z: source.z },
          modelBounds,
          simulation.receivers || [],
          surfaces,
          source.id,
          "source",
          modelObject3D,
        );
        return !validation.isValid;
      });

      if (hasInvalidSource) {
        errors.push({
          type: "sourceValidity",
          message: "Some sources have validation errors",
          navigationTarget: "sources",
          highlightTarget: "add-source-button",
        });
      }
    }

    // Validate receivers using raycaster
    if (simulation.receivers && simulation.receivers.length > 0) {
      const modelBounds = getModelBounds(surfaces);
      const hasInvalidReceiver = simulation.receivers.some((receiver) => {
        const validation = validateSourceOrReceiver(
          { x: receiver.x, y: receiver.y, z: receiver.z },
          modelBounds,
          simulation.sources || [],
          surfaces,
          receiver.id,
          "receiver",
          modelObject3D,
        );
        return !validation.isValid;
      });

      if (hasInvalidReceiver) {
        errors.push({
          type: "receiverValidity",
          message: "Some receivers have validation errors",
          navigationTarget: "sources",
          highlightTarget: "add-receiver-button",
        });
      }
    }

    if (surfaces.length > 0) {
      const layerIdByMaterialId = simulation.layerIdByMaterialId || {};
      const assignedSurfaceCount = Object.keys(layerIdByMaterialId).length;

      if (assignedSurfaceCount === 0) {
        errors.push({
          type: "materials",
          message: `${surfaces.length} surface(s) need material assignment`,
          navigationTarget: "surfaces",
          highlightTarget: "material-assignment",
        });
      } else {
        const unassignedSurfaces = surfaces.filter((surface) => !layerIdByMaterialId[surface.id]);

        if (unassignedSurfaces.length > 0) {
          errors.push({
            type: "materials",
            message: `${unassignedSurfaces.length} surface(s) need material assignment`,
            navigationTarget: "surfaces",
            highlightTarget: "material-assignment",
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateSimulationSettings = () => {
    setSimulationSettingsErrors({});
    const results: Record<string, string> = {};

    if (simulation?.solverSettings?.simulationSettings && settingsData?.options) {
      settingsData?.options.forEach((option) => {
        const value = (simulation.solverSettings?.simulationSettings as Record<string, unknown>)[
          option.id
        ];
        const isValid =
          option.type === "string"
            ? true
            : typeof value === "number" &&
              (option.min === undefined || value >= option.min) &&
              (option.max === undefined || value <= option.max);

        if (!isValid) {
          results[option.id] = option.name;
        } else {
          delete results[option.id];
        }
      });
    }

    dispatch(setSimulationSettingsErrors(results));
    return results;
  };

  return { isValid, errors, validateSimulationSettings, simulationSettingsErrors };
}
