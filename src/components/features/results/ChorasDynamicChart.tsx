import Plot from "react-plotly.js";
import { CHART_COLORS_VARIANTS } from "@/constants";

interface ChartDataProps {
  x: number[];
  y: number[] | number[][];
  xlabel: string;
  ylabel: string;
  x_limits: [number, number];
  y_limits: [number, number];
  x_scale: "linear" | "log";
  legend?: string[];
  colors?: string[];
  lineDashes?: string[];
  x_values?: number[][];
}

interface ChorasDynamicChartProps {
  chartData: ChartDataProps;
  hiddenChannels?: string[];
  /**
   * Called when the user clicks an entry in the chart legend. The chart is fully
   * controlled (the handler returns `false` so Plotly skips its default toggle),
   * so this callback must update the parent's `hiddenChannels` state to keep the
   * dropdown in sync with the legend.
   */
  onToggleChannel?: (channelName: string) => void;
}

const ChorasDynamicChart = ({
  chartData,
  hiddenChannels,
  onToggleChannel,
}: ChorasDynamicChartProps) => {
  // Defensive check in case the API data has not finished loading yet
  if (!chartData || !chartData.y) {
    return <div className="p-4 text-center text-gray-500">Loading chart data...</div>;
  }

  // 1. Check whether 'y' is a 2D array (multi-channel) or a plain 1D array
  const isMultiChannel = Array.isArray(chartData.y[0]);

  // If the backend sends no legend, fall back to default labels
  const legendLabels =
    chartData.legend ||
    (isMultiChannel ? (chartData.y as number[][]).map((_, i) => `Channel ${i + 1}`) : ["Signal"]);

  // 2. Convert the data into Plotly traces
  // Channels hidden via the dropdown are NOT removed from the traces, since that would
  // also remove their legend entry. Instead the trace is kept with
  // `visible: "legendonly"`, so the line is not drawn, but the legend entry stays
  // semi-transparent and can be toggled back on (by clicking the legend).
  const traces = legendLabels
    .map((channelName, originalIndex) => ({ channelName, originalIndex }))
    .map(({ channelName, originalIndex }) => {
      return {
        x: chartData.x_values?.[originalIndex] ?? chartData.x,
        y: isMultiChannel ? (chartData.y as number[][])[originalIndex] : (chartData.y as number[]),
        type: "scatter",
        mode: "lines",
        name: channelName,
        visible: hiddenChannels?.includes(channelName) ? ("legendonly" as const) : true,
        line: {
          width: 2.8,
          color:
            chartData.colors?.[originalIndex] ??
            CHART_COLORS_VARIANTS[originalIndex % CHART_COLORS_VARIANTS.length],
          dash: chartData.lineDashes?.[originalIndex] ?? "solid",
        },
      };
    });

  const thirdOctaveFrequencies = [
    16, 20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250,
    1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
  ];
  const octaveFrequencies = [16, 31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  // Log frequency axes always extend to 20 kHz, even when the JSON x_limits stop earlier
  const logAxisMaxHz = 20000;
  const logAxisMax =
    chartData.x_scale === "log"
      ? Math.max(chartData.x_limits[1], logAxisMaxHz)
      : chartData.x_limits[1];
  const visibleThirdOctaveFrequencies = thirdOctaveFrequencies.filter(
    (frequency) => frequency >= chartData.x_limits[0] && frequency <= logAxisMax,
  );
  const visibleMajorFrequencies = octaveFrequencies
    .filter((frequency) => frequency >= chartData.x_limits[0] && frequency <= logAxisMax)
    .sort((left, right) => left - right);
  const visibleMinorFrequencies = visibleThirdOctaveFrequencies.filter(
    (frequency) => !visibleMajorFrequencies.includes(frequency),
  );

  // 3. Layout configuration, read from the plot JSON
  const layout = {
    // Keep user zoom and pan across re-renders, reset them when the plot type changes
    uirevision: `${chartData.xlabel}-${chartData.ylabel}-${chartData.x_scale}`,
    xaxis: {
      title: {
        text: chartData.xlabel || "Time (s)",
        font: {
          family: "Inter, sans-serif",
          size: 14,
          color: "#373d3f",
        },
        standoff: 8,
      },
      type: chartData.x_scale, // 'linear' or 'log' (e.g. log for the spectrum)
      // Plotly log axis requires range in log10 units
      range:
        chartData.x_scale === "log"
          ? [Math.log10(chartData.x_limits[0]), Math.log10(logAxisMax)]
          : chartData.x_limits,
      showgrid: true,
      gridcolor: "#90A4AE",
      griddash: "solid",
      showline: true,
      mirror: true,
      linecolor: "#333",
      linewidth: 1,
      zeroline: false,
      ...(chartData.x_scale === "log"
        ? {
            tickmode: "array" as const,
            tickvals: visibleMajorFrequencies,
            ticktext: visibleMajorFrequencies.map((frequency) =>
              frequency >= 1000 ? `${frequency / 1000}k` : `${frequency}`,
            ),
            minor: {
              tickmode: "array" as const,
              tickvals: visibleMinorFrequencies,
              ticks: "outside" as const,
            },
          }
        : {}),
    },
    yaxis: {
      title: {
        text: chartData.ylabel || "Signal",
        font: {
          family: "Inter, sans-serif",
          size: 14,
          color: "#373d3f",
        },
        standoff: 8,
      },
      type: "linear", // Linear y-axis, the backend already computes dB values
      range: chartData.y_limits, // Default y-limits from the JSON, user zoom overrides them
      showgrid: true,
      gridcolor: "#90A4AE",
      griddash: "solid",
      showline: true,
      mirror: true,
      linecolor: "#333",
      linewidth: 1,
      zeroline: false,
    },
    margin: { t: 60, b: 60, l: 60, r: 20 },
    showlegend: true,
    legend: {
      orientation: "h" as const,
      yanchor: "bottom" as const,
      y: 1.03,
      xanchor: "center" as const,
      x: 0.5,
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  };

  const config = {
    responsive: true,
    displayModeBar: "hover" as const,
    displaylogo: false,
    scrollZoom: true,
    doubleClick: "reset" as const,
  };

  return (
    <div className="w-full h-[500px]">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: "100%", height: "100%" }}
        onLegendClick={(event: { curveNumber?: number }) => {
          // Sync legend → dropdown: clicking a legend item updates the parent's
          // hiddenChannels state. Returning `false` makes Plotly skip its internal toggle
          // (see clickOrDoubleClick in plotly.js), so trace visibility is fully
          // controlled by React state.
          const channelName = legendLabels[event.curveNumber ?? -1];
          if (channelName && onToggleChannel) {
            onToggleChannel(channelName);
          }
          return false;
        }}
      />
    </div>
  );
};

export default ChorasDynamicChart;
