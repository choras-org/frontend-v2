import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetSimulationResultQuery } from "@/store/simulationApi";
import { Loading } from "@/components/ui/loading";
import { http } from "@/libs/http";
import { downloadFile, formatFilename } from "@/helpers/file";
import { cn } from "@/libs/style";
import JSZip from "jszip";
import { useJsonBuilder } from "@/hooks/useJsonBuilder";
import { useDownloadPreferences } from "@/hooks/useDownloadPreferences";

type DownloadResultProps = {
  simulationIds: number[];
  mode?: "parameters" | "plots" | "auralizations";
  triggerLabel?: string;
  allSelected?: boolean;
};

export function DownloadResult({
  simulationIds,
  mode,
  triggerLabel,
  allSelected,
}: DownloadResultProps) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const allSections = ["parameters", "plots", "auralizations"];
  const visibleSections = useMemo(() => (mode ? [mode] : allSections), [mode]);

  const { data: simulationResult, isLoading } = useGetSimulationResultQuery(simulationIds[0], {
    skip: simulationIds.length === 0,
  });

  const enabledFrequencies = useMemo(() => {
    if (!simulationResult?.length) return [];
    return simulationResult[0].frequencies || [];
  }, [simulationResult]);

  const {
    parameters,
    setParameters,
    plots,
    setPlots,
    auralizations,
    setAuralizations,
    parameterOptions,
    updateParameterOptions,
    plotOptions,
    updatePlotOptions,
    auralizationOptions,
    updateAuralizationOptions,
    settingJsonOptions,
    updateSettingJsonOptions,
    resetAll,
  } = useDownloadPreferences(enabledFrequencies, visibleSections, allSelected);

  const { buildJsonStructure, stringifyWithHorizontalArrays } = useJsonBuilder();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Build the output in the required format
      const output: Record<string, (string | number)[]> = {
        xlsx: ["true"],
        SimulationId: simulationIds,
        Parameters: [],
        EDC: [],
        Auralization: [],
      };

      const selectedParams = Object.entries(parameterOptions)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key);

      if (selectedParams.length > 0) {
        output.Parameters = selectedParams;
      }

      const selectedPlots = Object.entries(plotOptions)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key);

      if (selectedPlots.length > 0) {
        output.EDC = selectedPlots;
      }

      const selectedAuralizations = Object.entries(auralizationOptions)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key);

      if (selectedAuralizations.length > 0) {
        output.Auralization = selectedAuralizations;
      }

      // Request the export
      const { data } = await http({
        method: "POST",
        url: "/exports/custom_export",
        data: output,
        responseType: "blob",
      });

      // If settings.json is requested, zip it together
      if (settingJsonOptions) {
        const zip = new JSZip();
        zip.file("results.zip", data);
        const settingsJson = stringifyWithHorizontalArrays(buildJsonStructure());
        zip.file("settings.json", settingsJson);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadFile(
          zipBlob,
          formatFilename(`simulation ${simulationIds.join(",")} results+settings.zip`),
        );
      } else {
        downloadFile(data, formatFilename(`simulation ${simulationIds.join(",")} results.zip`));
      }

      toast.success("Download started successfully");
      setOpen(false);
    } catch {
      toast.error("Failed to start download");
    } finally {
      setIsDownloading(false);
    }
  };

  const resetSelections = () => {
    resetAll();
  };

  if (isLoading) return <Loading />;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetSelections();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outlineSecondary">
          <Download className="h-4 w-4" />
          {triggerLabel ?? "Download"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select your preferences</DialogTitle>
          <DialogDescription>Choose which results you want to download.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Parameters Section */}
          <div className={cn("space-y-3", { hidden: !visibleSections.includes("parameters") })}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parameters"
                checked={parameters}
                onCheckedChange={(checked) => {
                  const isChecked = !!checked;
                  setParameters(isChecked);
                  const options = {
                    edt: isChecked,
                    t20: isChecked,
                    t30: isChecked,
                    c80: isChecked,
                    d50: isChecked,
                    ts: isChecked,
                    spl_t0_freq: isChecked,
                  };
                  updateParameterOptions(options);
                }}
              />
              <Label htmlFor="parameters" className="font-medium">
                Parameters
              </Label>
            </div>

            <div className="ml-6 grid grid-cols-3 gap-3">
              {Object.entries(parameterOptions).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(value) =>
                      updateParameterOptions({ ...parameterOptions, [key]: !!value })
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key.toUpperCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Plots Section */}
          <div className={cn("space-y-3", { hidden: !visibleSections.includes("plots") })}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plots"
                checked={plots}
                onCheckedChange={(checked) => {
                  const isChecked = !!checked;
                  setPlots(isChecked);
                  const options = {
                    "63Hz": isChecked && enabledFrequencies.includes(63),
                    "125Hz": isChecked && enabledFrequencies.includes(125),
                    "250Hz": isChecked && enabledFrequencies.includes(250),
                    "500Hz": isChecked && enabledFrequencies.includes(500),
                    "1000Hz": isChecked && enabledFrequencies.includes(1000),
                    "2000Hz": isChecked && enabledFrequencies.includes(2000),
                    "4000Hz": isChecked && enabledFrequencies.includes(4000),
                    "8000Hz": isChecked && enabledFrequencies.includes(8000),
                  };
                  updatePlotOptions(options);
                }}
              />
              <Label htmlFor="plots" className="font-medium">
                Plots
              </Label>
            </div>

            <div className="ml-6 grid grid-cols-3 gap-3">
              {Object.entries(plotOptions).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`plot-${key}`}
                    checked={checked}
                    disabled={!enabledFrequencies.includes(parseInt(key.replace("Hz", "")))}
                    onCheckedChange={(value) =>
                      updatePlotOptions({ ...plotOptions, [key]: !!value })
                    }
                  />
                  <Label htmlFor={`plot-${key}`} className="text-sm">
                    {key}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Auralizations Section */}
          <div className={cn("space-y-3", { hidden: !visibleSections.includes("auralizations") })}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auralizations"
                checked={auralizations}
                onCheckedChange={(checked) => {
                  const isChecked = !!checked;
                  setAuralizations(isChecked);
                  const options = {
                    wavIR: isChecked,
                    csvIR: isChecked,
                  };
                  updateAuralizationOptions(options);
                }}
              />
              <Label htmlFor="auralizations" className="font-medium">
                Auralization
              </Label>
            </div>

            <div className="ml-6 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wavIR"
                  checked={auralizationOptions.wavIR}
                  onCheckedChange={(value) =>
                    updateAuralizationOptions({ ...auralizationOptions, wavIR: !!value })
                  }
                />
                <Label htmlFor="wavIR" className="text-sm">
                  .wav (Impulse Response)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="csvIR"
                  checked={auralizationOptions.csvIR}
                  onCheckedChange={(value) =>
                    updateAuralizationOptions({ ...auralizationOptions, csvIR: !!value })
                  }
                />
                <Label htmlFor="csvIR" className="text-sm">
                  Impulse Response (csv)
                </Label>
              </div>
            </div>
          </div>

          {/* Setting.json Section */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-settings-json"
              checked={settingJsonOptions}
              onCheckedChange={(checked) => {
                updateSettingJsonOptions(!!checked);
              }}
            />
            <Label htmlFor="include-settings-json" className="text-sm font-normal">
              Settings.json
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col items-start gap-4">
          <div className="flex w-full justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isDownloading}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
