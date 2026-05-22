import { useEffect, useMemo, useState } from "react";
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

  // Checkbox states
  const [parameters, setParameters] = useState(false);
  const [plots, setPlots] = useState(false);
  const [auralizations, setAuralizations] = useState(false);

  // Sub-options for Parameters
  const [parameterOptions, setParameterOptions] = useState({
    edt: false,
    t20: false,
    t30: false,
    c80: false,
    d50: false,
    ts: false,
    spl_t0_freq: false,
  });

  // Sub-options for Plots
  const [plotOptions, setPlotOptions] = useState({
    "63Hz": false,
    "125Hz": false,
    "250Hz": false,
    "500Hz": false,
    "1000Hz": false,
    "2000Hz": false,
    "4000Hz": false,
    "8000Hz": false,
  });

  // Sub-options for Auralizations
  const [auralizationOptions, setAuralizationOptions] = useState({
    wavIR: false,
    csvIR: false,
  });

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

      // Download the file
      downloadFile(data, formatFilename(`simulation ${simulationIds.join(",")} results.zip`));

      toast.success("Download started successfully");
      setOpen(false);
    } catch {
      toast.error("Failed to start download");
    } finally {
      setIsDownloading(false);
    }
  };

  const resetSelections = () => {
    if (allSelected) return;

    setParameters(false);
    setPlots(false);
    setAuralizations(false);
    setParameterOptions({
      edt: false,
      t20: false,
      t30: false,
      c80: false,
      d50: false,
      ts: false,
      spl_t0_freq: false,
    });
    setPlotOptions({
      "63Hz": false,
      "125Hz": false,
      "250Hz": false,
      "500Hz": false,
      "1000Hz": false,
      "2000Hz": false,
      "4000Hz": false,
      "8000Hz": false,
    });
    setAuralizationOptions({
      wavIR: false,
      csvIR: false,
    });
  };

  const enabledFrequencies = useMemo(() => {
    const defaultFrequencies: number[] = [];

    if (!simulationResult || !simulationResult.length) return defaultFrequencies;

    const firstResult = simulationResult[0];
    if (!firstResult.frequencies) return defaultFrequencies;

    return firstResult.frequencies;
  }, [simulationResult]);

  useEffect(() => {
    if (enabledFrequencies.length === 0) return;

    // If allSelected is true, select all available options
    if (allSelected) {
      setParameters(visibleSections.includes("parameters"));
      setPlots(visibleSections.includes("plots"));
      setAuralizations(visibleSections.includes("auralizations"));

      setParameterOptions({
        edt: visibleSections.includes("parameters"),
        t20: visibleSections.includes("parameters"),
        t30: visibleSections.includes("parameters"),
        c80: visibleSections.includes("parameters"),
        d50: visibleSections.includes("parameters"),
        ts: visibleSections.includes("parameters"),
        spl_t0_freq: visibleSections.includes("parameters"),
      });

      setPlotOptions({
        "63Hz": visibleSections.includes("plots") && enabledFrequencies.includes(63),
        "125Hz": visibleSections.includes("plots") && enabledFrequencies.includes(125),
        "250Hz": visibleSections.includes("plots") && enabledFrequencies.includes(250),
        "500Hz": visibleSections.includes("plots") && enabledFrequencies.includes(500),
        "1000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(1000),
        "2000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(2000),
        "4000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(4000),
        "8000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(8000),
      });

      setAuralizationOptions({
        wavIR: visibleSections.includes("auralizations"),
        csvIR: visibleSections.includes("auralizations"),
      });
    }
  }, [enabledFrequencies, visibleSections, allSelected]);

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
                  // Check/uncheck all parameter options
                  setParameterOptions({
                    edt: isChecked,
                    t20: isChecked,
                    t30: isChecked,
                    c80: isChecked,
                    d50: isChecked,
                    ts: isChecked,
                    spl_t0_freq: isChecked,
                  });
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
                      setParameterOptions((prev) => ({ ...prev, [key]: !!value }))
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
                  // Check/uncheck only enabled plot options
                  setPlotOptions({
                    "63Hz": isChecked && enabledFrequencies.includes(63),
                    "125Hz": isChecked && enabledFrequencies.includes(125),
                    "250Hz": isChecked && enabledFrequencies.includes(250),
                    "500Hz": isChecked && enabledFrequencies.includes(500),
                    "1000Hz": isChecked && enabledFrequencies.includes(1000),
                    "2000Hz": isChecked && enabledFrequencies.includes(2000),
                    "4000Hz": isChecked && enabledFrequencies.includes(4000),
                    "8000Hz": isChecked && enabledFrequencies.includes(8000),
                  });
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
                      setPlotOptions((prev) => ({ ...prev, [key]: !!value }))
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
                  // Check/uncheck all auralization options
                  setAuralizationOptions({
                    wavIR: isChecked,
                    csvIR: isChecked,
                  });
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
                    setAuralizationOptions((prev) => ({ ...prev, wavIR: !!value }))
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
                    setAuralizationOptions((prev) => ({ ...prev, csvIR: !!value }))
                  }
                />
                <Label htmlFor="csvIR" className="text-sm">
                  Impulse Response (csv)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDownloading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
