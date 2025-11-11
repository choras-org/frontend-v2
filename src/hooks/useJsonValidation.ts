import { useCallback } from "react";
import type { Source, Receiver } from "@/types/simulation";
import { validateSourceOrReceiver, getModelBounds } from "@/helpers/sourceReceiverValidation";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import { useGetSimulationMethodsQuery } from "@/store/simulationSettingsApi";

export function useJsonValidation() {
  // Pull required data from store/hooks
  const surfaces = useSurfaces();
  const sources = useSelector((state: RootState) => state.sourceReceiver.sources);
  const receivers = useSelector((state: RootState) => state.sourceReceiver.receivers);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const currentModel = useSelector((state: RootState) =>
    currentModelId ? state.model.rhinoFiles[currentModelId] : null,
  );
  const modelObject3D = currentModel?.object3D || null;
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: methods } = useGetSimulationMethodsQuery();

  // Validate receiver
  const validateReceiver = useCallback(
    (receiver: Receiver): Receiver => {
      const modelBounds = getModelBounds(surfaces);
      const validation = validateSourceOrReceiver(
        { x: receiver.x, y: receiver.y, z: receiver.z },
        modelBounds,
        sources,
        surfaces,
        receiver.id,
        "receiver",
        modelObject3D,
      );

      return {
        ...receiver,
        isValid: validation.isValid,
        validationError: validation.validationError,
      };
    },
    [surfaces, sources, modelObject3D],
  );

  // Validate source
  const validateSource = useCallback(
    (source: Source): Source => {
      const modelBounds = getModelBounds(surfaces);
      const validation = validateSourceOrReceiver(
        { x: source.x, y: source.y, z: source.z },
        modelBounds,
        receivers,
        surfaces,
        source.id,
        "source",
        modelObject3D,
      );

      return {
        ...source,
        isValid: validation.isValid,
        validationError: validation.validationError,
      };
    },
    [surfaces, receivers, modelObject3D],
  );

  // Validate simulation method
  const validateSimulationMethod = useCallback(
    (method: string): { isValid: boolean; error?: string } => {
      const validMethods = methods?.map((m) => m.simulationType) || [];
      if (!validMethods.includes(method)) {
        return {
          isValid: false,
          error: `Invalid simulation_method: "${method}". Valid methods are: ${validMethods.join(", ")}`,
        };
      }
      return { isValid: true };
    },
    [methods],
  );

  // Validate sources from JSON
  const validateSourcesFromJson = useCallback(
    (sourcesData: Record<string, unknown>): { isValid: boolean; error?: string } => {
      const sourceKeys = Object.keys(sourcesData);

      for (const key of sourceKeys) {
        const coords = sourcesData[key] as unknown;

        if (!Array.isArray(coords) || coords.length !== 3) {
          return {
            isValid: false,
            error: `Invalid source "${key}": must be an array of 3 numbers [x, y, z]`,
          };
        }

        if (!coords.every((n) => typeof n === "number" && !isNaN(n))) {
          return {
            isValid: false,
            error: `Invalid source "${key}": coordinates must be valid numbers`,
          };
        }

        const [x, y, z] = coords;
        const sourceToValidate: Source = {
          id: key,
          label: key,
          orderNumber: 0,
          x,
          y,
          z,
          isValid: true,
        };

        const validatedSource = validateSource(sourceToValidate);
        if (!validatedSource.isValid) {
          return {
            isValid: false,
            error: `Invalid source "${key}": ${validatedSource.validationError}`,
          };
        }
      }
      return { isValid: true };
    },
    [validateSource],
  );

  // Validate receivers from JSON
  const validateReceiversFromJson = useCallback(
    (receiversData: Record<string, unknown>): { isValid: boolean; error?: string } => {
      const receiverKeys = Object.keys(receiversData);

      for (const key of receiverKeys) {
        const coords = receiversData[key] as unknown;

        if (!Array.isArray(coords) || coords.length !== 3) {
          return {
            isValid: false,
            error: `Invalid receiver "${key}": must be an array of 3 numbers [x, y, z]`,
          };
        }

        if (!coords.every((n) => typeof n === "number" && !isNaN(n))) {
          return {
            isValid: false,
            error: `Invalid receiver "${key}": coordinates must be valid numbers`,
          };
        }

        const [x, y, z] = coords;
        const receiverToValidate: Receiver = {
          id: key,
          label: key,
          orderNumber: 0,
          x,
          y,
          z,
          isValid: true,
        };

        const validatedReceiver = validateReceiver(receiverToValidate);
        if (!validatedReceiver.isValid) {
          return {
            isValid: false,
            error: `Invalid receiver "${key}": ${validatedReceiver.validationError}`,
          };
        }
      }
      return { isValid: true };
    },
    [validateReceiver],
  );

  // Validate absorption coefficients from JSON
  const validateAbsorptionCoefficients = useCallback(
    (coefficientsData: Record<string, string>): { isValid: boolean; error?: string } => {
      const coeffKeys = Object.keys(coefficientsData);

      for (const surfaceKey of coeffKeys) {
        const coeffValue = coefficientsData[surfaceKey];

        if (typeof coeffValue !== "string") {
          return {
            isValid: false,
            error: `Invalid absorption_coefficients "${surfaceKey}": must be a string of comma-separated numbers`,
          };
        }

        const coeffArray = coeffValue.split(",").map((v: string) => parseFloat(v.trim()));

        if (coeffArray.length === 0) {
          return {
            isValid: false,
            error: `Invalid absorption_coefficients "${surfaceKey}": cannot be empty`,
          };
        }

        if (!coeffArray.every((n: number) => !isNaN(n) && n >= 0 && n <= 1)) {
          return {
            isValid: false,
            error: `Invalid absorption_coefficients "${surfaceKey}": all values must be numbers between 0 and 1`,
          };
        }

        const matchingMaterial = materials.find(
          (material) =>
            material.absorptionCoefficients.length === coeffArray.length &&
            material.absorptionCoefficients.every(
              (coeff, idx) => Math.abs(coeff - coeffArray[idx]) < 0.0001,
            ),
        );

        if (!matchingMaterial) {
          return {
            isValid: false,
            error: `Invalid absorption_coefficients "${surfaceKey}": [${coeffValue}] does not match any material in the database. Please use existing materials or add a new material first.`,
          };
        }
      }
      return { isValid: true };
    },
    [materials],
  );

  // Validate simulation settings from JSON with dynamic settings data
  const validateSimulationSettingsWithMethod = useCallback(
    async (
      settingsDataJson: Record<string, unknown>,
      simulationMethod: string,
    ): Promise<{ isValid: boolean; error?: string }> => {
      // Fetch settings data for the specific simulation method
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/simulation_settings/${simulationMethod}`,
      );
      const settingsData = response.ok ? await response.json() : null;
      const options = settingsData?.options;

      if (!options || !Array.isArray(options)) return { isValid: true };

      const settings = settingsDataJson as Record<string, unknown>;
      const settingKeys = Object.keys(settings);

      // Check for invalid keys
      for (const key of settingKeys) {
        const matchingOption = options.find((opt) => opt.id === key);
        if (!matchingOption) {
          return {
            isValid: false,
            error: `Unknown setting "${key}" in simulation_settings for method "${simulationMethod}". Valid settings are: ${options.map((opt) => `${opt.id} (${opt.name})`).join(", ")}`,
          };
        }
      }

      // Validate each option
      for (const option of options) {
        const key = option.id;
        const value = settings[key as keyof typeof settings];

        if (value === undefined || value === null) continue;

        // Radio display (select)
        if (option.display === "radio" && option.options) {
          const stringValue = String(value);
          const validValues = Object.values(option.options).map((v) => String(v));

          if (!validValues.includes(stringValue)) {
            return {
              isValid: false,
              error: `Invalid value for "${option.name}": "${value}" is not valid. Valid options are: ${validValues.join(", ")}`,
            };
          }
        }
        // Text display
        else if (option.display === "text") {
          if (option.type === "string") {
            if (typeof value !== "string") {
              return {
                isValid: false,
                error: `Invalid value for "${option.name}": must be a string`,
              };
            }
          } else if (option.type === "integer" || option.type === "float") {
            const numValueRaw = typeof value === "string" ? Number(value) : value;

            if (typeof numValueRaw !== "number" || Number.isNaN(numValueRaw)) {
              return {
                isValid: false,
                error: `Invalid value for "${option.name}": must be a number`,
              };
            }

            if (option.type === "integer" && !Number.isInteger(numValueRaw)) {
              return {
                isValid: false,
                error: `Invalid value for "${option.name}": must be an integer`,
              };
            }

            if (option.min !== undefined && numValueRaw < option.min) {
              return {
                isValid: false,
                error: `Invalid value for "${option.name}": ${numValueRaw} is less than minimum ${option.min}`,
              };
            }

            if (option.max !== undefined && numValueRaw > option.max) {
              return {
                isValid: false,
                error: `Invalid value for "${option.name}": ${numValueRaw} is greater than maximum ${option.max}`,
              };
            }
          }
        }
      }
      return { isValid: true };
    },
    [],
  );

  // Main validation function
  const validateJsonData = useCallback(
    async (jsonValue: string): Promise<{ isValid: boolean; error?: string }> => {
      try {
        const parsedData = JSON.parse(jsonValue);

        // Validate simulation_method first
        const simulationMethod = parsedData.simulation_method;
        if (simulationMethod) {
          const result = validateSimulationMethod(simulationMethod);
          if (!result.isValid) return result;
        }

        // Validate sources
        if (parsedData.sources && typeof parsedData.sources === "object") {
          const result = validateSourcesFromJson(parsedData.sources);
          if (!result.isValid) return result;
        }

        // Validate receivers
        if (parsedData.receivers && typeof parsedData.receivers === "object") {
          const result = validateReceiversFromJson(parsedData.receivers);
          if (!result.isValid) return result;
        }

        // Validate absorption_coefficients
        if (
          parsedData.absorption_coefficients &&
          typeof parsedData.absorption_coefficients === "object"
        ) {
          const result = validateAbsorptionCoefficients(parsedData.absorption_coefficients);
          if (!result.isValid) return result;
        }

        // Validate simulation_settings with the specified simulation_method
        if (
          parsedData.simulation_settings &&
          typeof parsedData.simulation_settings === "object" &&
          simulationMethod
        ) {
          const result = await validateSimulationSettingsWithMethod(
            parsedData.simulation_settings,
            simulationMethod,
          );
          if (!result.isValid) return result;
        }

        return { isValid: true };
      } catch (_err) {
        return { isValid: false, error: "Invalid JSON format. Please fix syntax errors." };
      }
    },
    [
      validateSimulationMethod,
      validateSourcesFromJson,
      validateReceiversFromJson,
      validateAbsorptionCoefficients,
      validateSimulationSettingsWithMethod,
    ],
  );

  return {
    validateJsonData,
    validateSimulationMethod,
    validateSourcesFromJson,
    validateReceiversFromJson,
    validateAbsorptionCoefficients,
    validateSimulationSettingsWithMethod,
  };
}
