import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useGetSimulationSettingsQuery } from "@/store/simulationSettingsApi";
import { setOptions } from "@/store/simulationSettingsSlice";
import { useGetSimulationByIdQuery, useUpdateSimulationMutation } from "@/store/simulationApi";
import { toast } from "sonner";
import { useJsonValidation } from "@/hooks/useJsonValidation";
import { useJsonBuilder } from "@/hooks/useJsonBuilder";
import { useJsonPayloadBuilder } from "@/hooks/useJsonPayloadBuilder";
import { setAssignments } from "@/store/materialAssignmentSlice";
import { updateValue } from "@/store/simulationSettingsSlice";
import { setSources, setReceivers } from "@/store/sourceReceiverSlice";

export function FullSettingJsonEditor() {
  const [open, setOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState<string>("");
  const [jsonValueOriginal, setJsonValueOriginal] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isValidJson, setIsValidJson] = useState(true);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [updateSimulation] = useUpdateSimulationMutation();
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const { data: simulation } = useGetSimulationByIdQuery(activeSimulation?.id ?? 0, {
    skip: !activeSimulation?.id,
  });

  const dispatch = useDispatch();
  const selectedMethodType = useSelector(
    (state: RootState) => state.simulationSettings.selectedMethodType,
  );

  const { data: settingsData } = useGetSimulationSettingsQuery(selectedMethodType);

  // Initialize custom hooks
  const {
    buildJsonStructure,
    stringifyWithHorizontalArrays,
    parseAbsorptionCoefficients,
    exportJson,
  } = useJsonBuilder();
  const { validateJsonData } = useJsonValidation();

  const { buildPayload } = useJsonPayloadBuilder();

  // Initialize settings options from API
  useEffect(() => {
    if (settingsData?.options) {
      dispatch(setOptions(settingsData.options));
    }
  }, [settingsData, dispatch]);

  useEffect(() => {
    if (simulation?.layerIdByMaterialId) {
      dispatch(setAssignments(simulation.layerIdByMaterialId));
    }
  }, [simulation?.layerIdByMaterialId, dispatch]);

  // Initialize JSON value when dialog opens
  useEffect(() => {
    if (open) {
      const jsonStructure = buildJsonStructure();
      const formattedJson = stringifyWithHorizontalArrays(jsonStructure);
      setJsonValue(formattedJson);
      setJsonValueOriginal(formattedJson);
    }
  }, [open, buildJsonStructure, stringifyWithHorizontalArrays]);

  // Handle reset button
  const handleReset = useCallback(() => {
    setJsonValue(jsonValueOriginal);
    setValidationError("");
    setIsValidJson(true);
  }, [jsonValueOriginal]);

  // Handle export button
  const handleExport = useCallback(() => {
    // Always rebuild from current redux state for consistency with forms
    const success = exportJson("settings.json");
    if (!success) {
      toast.error("Failed to export settings.json");
    } else {
      toast.success("settings.json exported");
    }
  }, [exportJson]);

  // Handle editor change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);

      // Clear error message and reset validation state when user edits
      setValidationError("");
      setIsValidJson(true); // Always enable button when editing

      // Clear previous timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Handle save button
  const handleSave = useCallback(async () => {
    const validationResult = await validateJsonData(jsonValue);

    if (!validationResult.isValid) {
      setIsValidJson(false);
      setValidationError(validationResult.error || "Validation failed");
      return;
    }

    setIsValidJson(true);
    setValidationError("");

    try {
      const parsedData = JSON.parse(jsonValue);

      // Parse absorption coefficients to surface-material mapping
      const surfaceMaterialMap = parsedData.absorption_coefficients
        ? parseAbsorptionCoefficients(parsedData.absorption_coefficients)
        : {};

      const hasBeenEdited = jsonValue !== jsonValueOriginal;
      const payload = buildPayload(parsedData, surfaceMaterialMap, hasBeenEdited);

      await updateSimulation(payload).unwrap();

      // Update simulation settings in store
      Object.entries(parsedData.simulation_settings || {}).forEach(([key, val]) => {
        if (typeof val === "string" || typeof val === "number") {
          dispatch(updateValue({ id: key, value: val }));
        } else if (typeof val === "boolean") {
          dispatch(updateValue({ id: key, value: val ? 1 : 0 }));
        } else if (val != null) {
          dispatch(updateValue({ id: key, value: JSON.stringify(val) }));
        }
      });

      // Update sources in store
      if (parsedData.sources && typeof parsedData.sources === "object") {
        const sourcesArray = Object.entries(parsedData.sources).map(([id, coords], index) => {
          const [x, y, z] = coords as [number, number, number];
          return {
            id,
            label: id,
            orderNumber: index,
            x,
            y,
            z,
            isValid: true,
          };
        });
        dispatch(setSources(sourcesArray));
      }

      // Update receivers in store
      if (parsedData.receivers && typeof parsedData.receivers === "object") {
        const receiversArray = Object.entries(parsedData.receivers).map(([id, coords], index) => {
          const [x, y, z] = coords as [number, number, number];
          return {
            id,
            label: id,
            orderNumber: index,
            x,
            y,
            z,
            isValid: true,
          };
        });
        dispatch(setReceivers(receiversArray));
      }

      toast.success("Settings saved successfully");

      // Update original value and close dialog after successful save
      setJsonValueOriginal(jsonValue);
    } catch (error: unknown) {
      toast.error("Failed to save settings");
      console.error("Error saving settings:", error);
    }
  }, [jsonValue, validateJsonData, parseAbsorptionCoefficients, buildPayload, updateSimulation]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={"sm"}
          className="hover:bg-gray-600 hover:text-white border border-choras-gray rounded-lg w-full"
        >
          Open JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="!w-[700px] !max-w-none max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Settings With JSON</DialogTitle>
          <DialogDescription>
            You can edit settings from this JSON editor. Changes will be reflected in the form
            inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
          <Editor
            height="400px"
            language="json"
            theme="vs-light"
            value={jsonValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              renderWhitespace: "selection",
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        {validationError && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
            {validationError}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-choras-primary cursor-pointer"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-choras-primary cursor-pointer"
          >
            Export
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValidJson || !!validationError}
            className="bg-choras-primary disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
