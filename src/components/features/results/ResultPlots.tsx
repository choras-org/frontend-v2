import {
  useGetSimulationResultQuery,
  useLazyGetVisualizationDataQuery,
} from "@/store/simulationApi";
import { Loading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useRef, useState } from "react";
import { DownloadResult } from "./DownloadResult";
import { selectCompareResults, selectCompareSimulationIds } from "@/store/simulationSelector";
import { shallowEqual, useSelector } from "react-redux";
import { simulationApi } from "@/store/simulationApi";
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { cn } from "@/libs/style";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import { plotlyDashForFrequencyBand, shadeForFrequencyBand } from "@/helpers/frequencyBandStyle";
import type { VisualizationData, VisualizationType } from "@/types/simulation";
import { CHART_COLORS_VARIANTS } from "@/constants";

import ChorasDynamicChart from "./ChorasDynamicChart";

const selectComparisonSimulationNames = createSelector(
  [selectCompareResults, (state: RootState) => state],
  (compareResults, state) =>
    Object.fromEntries(
      compareResults.flatMap(({ simulationId, modelId }) => {
        if (!simulationId) return [];

        const simulations =
          simulationApi.endpoints.getSimulationsByModelId.select(modelId)(state).data;
        const simulation = simulations?.find((item) => item.id === simulationId);

        return simulation ? [[simulationId, simulation.name] as const] : [];
      }),
    ),
);

type ResultParametersProps = {
  simulationId: number;
};

export function ResultPlots({ simulationId }: ResultParametersProps) {
  const compareResultIds = useSelector(selectCompareSimulationIds);
  const compareResults = useSelector(selectCompareResults);
  const activeSimulationId = compareResultIds[0] ?? simulationId;
  const [activeTab, setActiveData] = useState<VisualizationType>("rir_db");
  const [hiddenChannels, setHiddenChannels] = useState<string[]>([]);

  const { data: results, isLoading, error } = useGetSimulationResultQuery(activeSimulationId);

  const [loadVisualizationData] = useLazyGetVisualizationDataQuery();
  const [chartData, setChartData] = useState<VisualizationData | null>(null);
  const [isChartDataLoading, setIsChartDataLoading] = useState(false);
  const [chartDataError, setChartDataError] = useState<unknown>(null);
  const simulationNames = useSelector(selectComparisonSimulationNames, shallowEqual);
  const simulationNamesRef = useRef(simulationNames);
  simulationNamesRef.current = simulationNames;
  const chartScale: VisualizationData["x_scale"] =
    activeTab === "spectrum" || activeTab === "spectrum_db" ? "log" : "linear";

  const getChartTitle = () => {
    switch (activeTab) {
      case "edc":
        return "Energy Decay Curve";
      case "spectrum_db":
        return "Signal Spectrum (dB)";
      case "spectrum":
        return "Signal Spectrum (Linear)";
      case "rir_db":
        return "Room Impulse Response (dB)";
      case "rir":
        return "Room Impulse Response (Linear)";
      default:
        return "Visualization Plot";
    }
  };

  useEffect(() => {
    // Reset channel visibility when chart type changes
    setHiddenChannels([]);
  }, [activeTab]);

  useEffect(() => {
    const comparisonEntries = compareResults.filter((compareResult) => compareResult.simulationId);
    const visualizationSimulationIds = comparisonEntries.length
      ? comparisonEntries.map((compareResult) => compareResult.simulationId as number)
      : [simulationId];
    let isCancelled = false;

    setIsChartDataLoading(true);
    setChartDataError(null);

    Promise.all(
      visualizationSimulationIds.map((visualizationSimulationId) =>
        loadVisualizationData({
          simulationId: visualizationSimulationId,
          visualizationType: activeTab,
        }).unwrap(),
      ),
    )
      .then((visualizationResults) => {
        if (isCancelled || visualizationResults.length === 0) return;

        const firstResult = visualizationResults[0];
        const combinedLegend: string[] = [];
        const combinedY: number[][] = [];
        const combinedX: number[][] = [];
        const combinedColors: string[] = [];
        const combinedDashes: string[] = [];

        visualizationResults.forEach((result: VisualizationData, resultIndex: number) => {
          const channels = Array.isArray(result.y[0])
            ? result.y
            : [result.y as unknown as number[]];
          const baseColor =
            CHART_COLORS_VARIANTS[resultIndex % CHART_COLORS_VARIANTS.length] ??
            comparisonEntries[resultIndex]?.color ??
            "#EF7305";
          const shadeFrequencyBands = activeTab === "edc";

          channels.forEach((values: number[], channelIndex: number) => {
            const channelName = result.legend?.[channelIndex] ?? `Channel ${channelIndex + 1}`;
            const simulationId = visualizationSimulationIds[resultIndex];
            const simulationLabel =
              simulationNamesRef.current[simulationId] ?? `Simulation ${simulationId}`;

            combinedLegend.push(
              visualizationResults.length > 1 ? `${simulationLabel} - ${channelName}` : channelName,
            );
            combinedY.push(values);
            combinedX.push(result.x);
            combinedColors.push(
              shadeFrequencyBands
                ? shadeForFrequencyBand(baseColor, channelIndex, channels.length)
                : baseColor,
            );
            combinedDashes.push(
              shadeFrequencyBands ? plotlyDashForFrequencyBand(channelIndex) : "solid",
            );
          });
        });

        const combinedXLimits: [number, number] = [
          Math.min(...visualizationResults.map((result) => result.x_limits[0])),
          Math.max(...visualizationResults.map((result) => result.x_limits[1])),
        ];
        const combinedYLimits: [number, number] = [
          Math.min(...visualizationResults.map((result) => result.y_limits[0])),
          Math.max(...visualizationResults.map((result) => result.y_limits[1])),
        ];

        setChartData({
          ...firstResult,
          x_scale: chartScale,
          x_limits: combinedXLimits,
          y_limits: combinedYLimits,
          y: combinedY,
          legend: combinedLegend,
          colors: combinedColors,
          lineDashes: combinedDashes,
          x_values: combinedX,
        });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setChartData(null);
          setChartDataError(error);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsChartDataLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTab, chartScale, compareResults, loadVisualizationData, simulationId]);

  if (isLoading) return <Loading className="h-container justify-center" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load plot data</AlertDescription>
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

  return (
    <div className="h-full w-full p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-choras-primary font-inter font-bold">Plots</h1>
        <DownloadResult simulationIds={compareResultIds} mode="plots" />
      </div>
      {/* Dynamic Chart */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <h2 className="text-sm font-semibold text-gray-600">{getChartTitle()}</h2>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="max-w-64 border-black text-black hover:border-black hover:text-black hover:bg-black/5"
                >
                  <span className="min-w-0 truncate">
                    {hiddenChannels.length === 0
                      ? "All Channels"
                      : `${hiddenChannels.length} hidden`}
                  </span>
                  <ChevronDownIcon className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {(chartData?.legend ?? []).map((channel: string) => {
                  const isChannelHidden = hiddenChannels.includes(channel);
                  return (
                    <DropdownMenuItem
                      key={channel}
                      className={cn(isChannelHidden && "opacity-40")}
                      onSelect={(event) => {
                        event.preventDefault();
                        setHiddenChannels((prev) =>
                          prev.includes(channel)
                            ? prev.filter((c) => c !== channel)
                            : [...prev, channel],
                        );
                      }}
                    >
                      {channel}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-black text-black hover:border-black hover:text-black hover:bg-black/5"
                >
                  {getChartTitle()}
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {(
                  [
                    { value: "edc", label: "Energy Decay Curve (dB)" },
                    { value: "spectrum_db", label: "Signal Spectrum (dB)" },
                    { value: "spectrum", label: "Signal Spectrum (Linear)" },
                    { value: "rir_db", label: "Room Impulse Response (dB)" },
                    { value: "rir", label: "Room Impulse Response (Linear)" },
                  ] as { value: VisualizationType; label: string }[]
                ).map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    className={cn(activeTab === item.value && "font-semibold")}
                    onSelect={(event) => {
                      event.preventDefault();
                      setActiveData(item.value);
                    }}
                  >
                    {activeTab === item.value && (
                      <span className="absolute left-2 flex size-3.5 items-center justify-center">
                        <svg
                          className="size-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <span className={cn(activeTab === item.value ? "pl-6" : "pl-2")}>
                      {item.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="border border-black rounded-sm p-2">
          {isChartDataLoading ? (
            <Loading className="h-64 justify-center" />
          ) : chartDataError || !chartData ? (
            <Alert variant="default">
              <AlertDescription>No visualization data available</AlertDescription>
            </Alert>
          ) : (
            <ChorasDynamicChart
              chartData={chartData}
              hiddenChannels={hiddenChannels.length === 0 ? undefined : hiddenChannels}
              onToggleChannel={(channelName) => {
                setHiddenChannels((prev) =>
                  prev.includes(channelName)
                    ? prev.filter((channel) => channel !== channelName)
                    : [...prev, channelName],
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
