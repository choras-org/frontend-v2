import { useGetSimulationResultQuery } from "@/store/simulationApi";
import { Loading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { DownloadResult } from "./DownloadResult";
import {
  selectCompareResultsPlotsSeriesData,
  selectCompareSimulationIds,
} from "@/store/simulationSelector";
import { useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import Chart from "react-apexcharts";

type ResultParametersProps = {
  simulationId: number;
};

export function ResultPlots({ simulationId }: ResultParametersProps) {
  const [selectedFrequencies, setSelectedFrequencies] = useState<number[]>([125]);
  const { data: results, isLoading, error } = useGetSimulationResultQuery(simulationId);
  const compareResultIds = useSelector(selectCompareSimulationIds);
  const seriesData = useSelector(selectCompareResultsPlotsSeriesData(selectedFrequencies));

  const enabledFrequencies = useMemo(() => {
    const defaultFrequencies: number[] = [];

    if (!results || !results.length) return defaultFrequencies;

    const firstResult = results[0];
    if (!firstResult.frequencies) return defaultFrequencies;

    return firstResult.frequencies;
  }, [results]);

  if (isLoading) return <Loading className="h-container justify-center" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load impulse response</AlertDescription>
      </Alert>
    );
  }

  if (!results || results.length === 0 || results[0].responses.length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>No data available</AlertDescription>
      </Alert>
    );
  }

  console.log(seriesData, "<<<");

  return (
    <div className="h-full w-full p-8 space-y-4">
      <h1 className="text-2xl text-choras-secondary font-inter font-bold mb-8">Plots</h1>

      <div className="flex justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-black text-black hover:border-black hover:text-black hover:bg-black/5"
            >
              {selectedFrequencies.map((freq) => `${freq} Hz`).join(", ") || "Select Frequencies"}

              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {enabledFrequencies.map((freq) => (
              <DropdownMenuCheckboxItem
                key={freq}
                checked={selectedFrequencies.includes(freq)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedFrequencies((prev) => [...prev, freq]);
                  } else {
                    setSelectedFrequencies((prev) => prev.filter((f) => f !== freq));
                  }
                }}
              >
                {freq} Hz
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DownloadResult simulationIds={compareResultIds} mode="plots" />
      </div>

      <div className="border border-black p-2 rounded-sm">
        <Chart
          type="line"
          options={{
            chart: {
              type: "line",
              zoom: {
                enabled: true,
              },
            },
            xaxis: {
              type: "numeric",
              title: {
                text: "Time (s)",
              },
              labels: {
                formatter: function (val) {
                  return parseFloat(val).toFixed(3) + "s";
                },
              },
            },
            yaxis: {
              title: {
                text: "Energy decay curve (dB)",
              },
            },
            legend: {
              show: true,
              showForSingleSeries: true,
              position: "top",
              horizontalAlign: "center",
            },
            grid: {
              show: true,
              borderColor: "#90A4AE",
              strokeDashArray: 3,
              position: "back",
              xaxis: {
                lines: {
                  show: true,
                },
              },
            },
          }}
          series={seriesData}
          height={500}
        />
      </div>
    </div>
  );
}
