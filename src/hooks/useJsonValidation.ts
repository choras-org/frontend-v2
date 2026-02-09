import { useCallback } from "react";
import type { Source, Receiver } from "@/types/simulation";
import { validateSourceOrReceiver, getModelBounds } from "@/helpers/sourceReceiverValidation";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import { useGetSimulationMethodsQuery } from "@/store/simulationSettingsApi";
import { http } from "@/libs/http";

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
      if (sourceKeys.length > 1) {
        return {
          isValid: false,
          error: `Only one source is allowed at the moment. Found: ${sourceKeys.length}`,
        };
      }
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
      if (receiverKeys.length > 1) {
        return {
          isValid: false,
          error: `Only one receiver is allowed at the moment. Found: ${receiverKeys.length}`,
        };
      }
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

  // Interface for new materials that need to be created
  interface NewMaterial {
    coefficients: number[];
    coefficientString: string;
    surfaceNames: string[];
  }

  // Helper function to detect new materials (coefficients that don't match existing materials)
  const detectNewMaterials = useCallback(
    (coefficientsData: Record<string, string>): NewMaterial[] => {
      const newMaterialsMap = new Map<string, NewMaterial>();

      for (const surfaceKey of Object.keys(coefficientsData)) {
        const coeffValue = coefficientsData[surfaceKey];
        const coeffArray = coeffValue.split(",").map((v: string) => parseFloat(v.trim()));

        // Check if this coefficient matches any existing material
        const matchingMaterial = materials.find(
          (material) =>
            material.absorptionCoefficients.length === coeffArray.length &&
            material.absorptionCoefficients.every(
              (coeff, idx) => Math.abs(coeff - coeffArray[idx]) < 0.0001,
            ),
        );

        // If no match, add to new materials map
        if (!matchingMaterial) {
          // Normalize the coefficient string for grouping (remove extra spaces)
          const normalizedCoeffString = coeffArray.join(", ");

          if (!newMaterialsMap.has(normalizedCoeffString)) {
            newMaterialsMap.set(normalizedCoeffString, {
              coefficients: coeffArray,
              coefficientString: normalizedCoeffString,
              surfaceNames: [],
            });
          }
          newMaterialsMap.get(normalizedCoeffString)!.surfaceNames.push(surfaceKey);
        }
      }

      return Array.from(newMaterialsMap.values());
    },
    [materials],
  );

  // Validate absorption coefficients from JSON
  const validateAbsorptionCoefficients = useCallback(
    (
      coefficientsData: Record<string, string>,
    ): {
      isValid: boolean;
      error?: string;
      newMaterials?: NewMaterial[];
    } => {
      const coeffKeys = Object.keys(coefficientsData);

      // First, validate format and range for all coefficients
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
      }

      // Format validation passed, now detect new materials
      const newMaterials = detectNewMaterials(coefficientsData);

      return {
        isValid: true,
        newMaterials: newMaterials.length > 0 ? newMaterials : undefined,
      };
    },
    [detectNewMaterials],
  );

  // Validate simulation settings from JSON with dynamic settings data
  const validateSimulationSettingsWithMethod = useCallback(
    async (
      settingsDataJson: Record<string, unknown>,
      simulationMethod: string,
    ): Promise<{ isValid: boolean; error?: string }> => {
      // Fetch settings data for the specific simulation method
      const { data: settingsData } = await http.get(`/simulation_settings/${simulationMethod}`);
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
          }
        }
      }
      return { isValid: true };
    },
    [],
  );

  // Main validation function
  const validateJsonData = useCallback(
    async (
      jsonValue: string,
    ): Promise<{
      isValid: boolean;
      error?: string;
      newMaterials?: NewMaterial[];
    }> => {
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

        // Validate absorption_coefficients and collect new materials
        let newMaterials: NewMaterial[] | undefined;
        if (
          parsedData.absorption_coefficients &&
          typeof parsedData.absorption_coefficients === "object"
        ) {
          const result = validateAbsorptionCoefficients(parsedData.absorption_coefficients);
          if (!result.isValid) return result;
          newMaterials = result.newMaterials;
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

        return {
          isValid: true,
          newMaterials,
        };
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
