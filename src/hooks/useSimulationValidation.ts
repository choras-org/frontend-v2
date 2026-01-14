import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useSurfaces } from "./useSurfaces";
import { useGetSimulationByIdQuery } from "@/store/simulationApi";
import { validateSourceOrReceiver, getModelBounds } from "@/helpers/sourceReceiverValidation";
import { useEffect, useState } from "react";
import {
  addError,
  removeError,
  setOptions,
  clearSettings,
  updateValue,
} from "@/store/simulationSettingsSlice";
import { useGetSimulationSettingsQuery } from "@/store/simulationSettingsApi";
import type { SimulationSettingsState } from "@/types/simulationSettings";

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
  const { options, values } = useSelector((state: RootState) => state.simulationSettings);
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
    if (simulation?.solverSettings?.simulationSettings && settingsData?.options) {
      const existingSettings = simulation.solverSettings
        .simulationSettings as SimulationSettingsState["values"];

      dispatch(clearSettings());
      dispatch(setOptions(settingsData.options));

      settingsData.options.forEach((option) => {
        const savedValue = existingSettings[option.id];
        if (savedValue !== undefined) {
          dispatch(updateValue({ id: option.id, value: savedValue }));
        }
      });
    }
  }, [simulation?.id, settingsData?.options, dispatch]);

  useEffect(() => {
    options.forEach((option) => {
      if (values[option.id] !== undefined) {
        const value = values[option.id];
        const isValid =
          option.type === "string"
            ? true
            : typeof value === "number" &&
              (option.min === undefined || value >= option.min) &&
              (option.max === undefined || value <= option.max);
        if (!isValid) {
          dispatch(addError({ id: option.id, name: option.name }));
        } else {
          dispatch(removeError(option.id));
        }
      }
    });
  }, [values, options, dispatch]);

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

  return { isValid, errors, simulationSettingsErrors };
}
