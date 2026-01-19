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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MaterialFormDialog } from "./MaterialFormDialog";
import type { Material } from "@/types/material";
import { useCreateMaterialMutation } from "@/store/materialsApi";

export function FullSettingJsonEditor() {
  const [open, setOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState<string>("");
  const [jsonValueOriginal, setJsonValueOriginal] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isValidJson, setIsValidJson] = useState(true);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOpenConfirmCreateMaterials, setIsOpenConfirmCreateMaterials] = useState(false);
  const [newMaterialsToCreate, setNewMaterialsToCreate] = useState<
    {
      coefficients: number[];
      coefficientString: string;
      surfaceNames: string[];
    }[]
  >([]);
  const [activeCreateMaterialIndex, setActiveCreateMaterialIndex] = useState(0);
  const [isOpenMaterialForm, setIsOpenMaterialForm] = useState(false);
  const [createMaterial, { isLoading: isCreatingMaterial }] = useCreateMaterialMutation();

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
  }, [open]);

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

    if (validationResult?.newMaterials && validationResult.newMaterials.length > 0) {
      setNewMaterialsToCreate(validationResult.newMaterials);
      setIsOpenConfirmCreateMaterials(true);
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
      setJsonValueOriginal(jsonValue);
    } catch (error: unknown) {
      toast.error("Failed to save settings");
      console.error("Error saving settings:", error);
    }
  }, [jsonValue, validateJsonData, parseAbsorptionCoefficients, buildPayload, updateSimulation]);

  const handleCreateMaterial = async (
    material: Omit<Material, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      setIsOpenConfirmCreateMaterials(false);
      await createMaterial(material).unwrap();
      toast.success("Material created successfully!");

      const newIndex = activeCreateMaterialIndex + 1;
      if (newIndex < newMaterialsToCreate.length) {
        setActiveCreateMaterialIndex(newIndex);
      } else {
        setIsOpenMaterialForm(false);
        setActiveCreateMaterialIndex(0);
        setNewMaterialsToCreate([]);
      }
    } catch (error) {
      toast.error("Failed to create material");
      console.error("Error creating material:", error);
    }
  };

  return (
    <div>
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
      <ConfirmDialog
        title={`Create ${newMaterialsToCreate.length} New Material${
          newMaterialsToCreate.length > 1 ? "s" : ""
        }`}
        description={
          newMaterialsToCreate.length === 1
            ? "You assigned a material that does not yet exist in the database. Would you like to create a new material for it?"
            : `You assigned ${newMaterialsToCreate.length} materials that do not yet exist in the database. Would you like to create new materials for these?`
        }
        onConfirm={() => {
          if (newMaterialsToCreate.length > 0) {
            setActiveCreateMaterialIndex(0);
            setIsOpenMaterialForm(true);
          }
        }}
        confirmVariant="default"
        confirmLabel={`Create Material${newMaterialsToCreate.length > 1 ? "s" : ""}`}
        open={isOpenConfirmCreateMaterials}
        onOpenChange={setIsOpenConfirmCreateMaterials}
        trigger={<div></div>}
      />
      {newMaterialsToCreate.length > 0 &&
        activeCreateMaterialIndex < newMaterialsToCreate.length && (
          <MaterialFormDialog
            title={`Create material (${activeCreateMaterialIndex + 1}/${newMaterialsToCreate.length})`}
            label={`Create material (${activeCreateMaterialIndex + 1}/${newMaterialsToCreate.length})`}
            notes={
              newMaterialsToCreate[activeCreateMaterialIndex].surfaceNames.length > 0
                ? `Assigned to surfaces: ${newMaterialsToCreate[activeCreateMaterialIndex].surfaceNames.join(", ")}`
                : undefined
            }
            description="Create new material from assigned absorption coefficients"
            isOpen={isOpenMaterialForm}
            onOpen={() => setIsOpenMaterialForm(!isOpenMaterialForm)}
            isShownTrigger={false}
            material={{
              name: "",
              description: "",
              category: "",
              absorptionCoefficients: newMaterialsToCreate[activeCreateMaterialIndex].coefficients,
            }}
            isLoading={isCreatingMaterial}
            onSubmit={handleCreateMaterial}
          />
        )}
    </div>
  );
}
