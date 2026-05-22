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
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";
import { updateValue } from "@/store/simulationSettingsSlice";
import { useSimulationSettingsApi } from "@/hooks/useSimulationSettingsApi";
import type { RootState } from "@/store";
import type { SimulationSettingsState } from "@/types/simulationSettings";

export function SettingJsonEditor() {
  const [open, setOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState<string>("");
  const [isValidJson, setIsValidJson] = useState(true);

  const dispatch = useDispatch();
  const { options, values } = useSelector((state: RootState) => state.simulationSettings);
  const { updateSimulationSettings } = useSimulationSettingsApi();

  const keyOrder = [
    "sim_len_type",
    "de_ir_length",
    "de_c0",
    "edt",
    "de_absorption_override",
    "de_R",
  ];

  const orderJsonKeys = (obj: SimulationSettingsState["values"]) => {
    const ordered: SimulationSettingsState["values"] = {};

    keyOrder.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        ordered[key] = obj[key];
      }
    });

    Object.keys(obj).forEach((key) => {
      if (!keyOrder.includes(key)) {
        ordered[key] = obj[key];
      }
    });

    return ordered;
  };

  useEffect(() => {
    if (open) {
      const orderedValues = orderJsonKeys(values);
      setJsonValue(JSON.stringify(orderedValues, null, 2));
      setIsValidJson(true);
    }
  }, [open, values]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    setJsonValue(value);

    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleReset = () => {
    const orderedValues = orderJsonKeys(values);
    setJsonValue(JSON.stringify(orderedValues, null, 2));
    setIsValidJson(true);
    toast.info("JSON reset to current values");
  };

  const handleSave = async () => {
    if (!isValidJson) {
      toast.error("Invalid JSON format");
      return;
    }

    try {
      const parsedJson = JSON.parse(jsonValue) as SimulationSettingsState["values"];

      const validKeys = options.map((option) => option.id);
      const invalidKeys = Object.keys(parsedJson).filter((key) => !validKeys.includes(key));

      if (invalidKeys.length > 0) {
        toast.error(`Invalid setting keys: ${invalidKeys.join(", ")}`);
        return;
      }

      Object.entries(parsedJson).forEach(([key, value]) => {
        dispatch(updateValue({ id: key, value }));
      });

      await updateSimulationSettings(parsedJson);

      setOpen(false);
    } catch (error) {
      console.error("Failed to save JSON settings:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={"sm"}
          className="hover:bg-gray-600 hover:text-white border border-choras-gray rounded-lg"
        >
          Open as JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
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

        {!isValidJson && (
          <div className="text-red-500 text-sm">
            Invalid JSON format. Please fix syntax errors before saving.
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
            onClick={handleSave}
            disabled={!isValidJson}
            className="bg-choras-primary disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
