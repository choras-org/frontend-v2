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
   * Dipanggil ketika user mengklik entry di legend chart. Karena chart dibuat
   * fully controlled (handler mengembalikan `false` agar Plotly tidak menjalankan
   * toggle default-nya), panggilan balik ini harus meng-update state `hiddenChannels`
   * di parent sehingga dropdown pada tab tetap sinkron dengan legend.
   */
  onToggleChannel?: (channelName: string) => void;
}

const ChorasDynamicChart = ({
  chartData,
  hiddenChannels,
  onToggleChannel,
}: ChorasDynamicChartProps) => {
  // Defensive check jika data dari API belum selesai di-load (loading state)
  if (!chartData || !chartData.y) {
    return <div className="p-4 text-center text-gray-500">Loading chart data...</div>;
  }

  // 1. Cek apakah format data 'y' berbentuk 2D array (multi-channel) atau 1D array biasa
  const isMultiChannel = Array.isArray(chartData.y[0]);

  // Jika backend tidak mengirimkan property legend, kita buat fallback default array
  const legendLabels =
    chartData.legend ||
    (isMultiChannel ? (chartData.y as number[][]).map((_, i) => `Channel ${i + 1}`) : ["Signal"]);

  // 2. Transformasi data menjadi array traces Plotly secara dinamis
  // Channel yang di-hide lewat dropdown TIDAK dihapus dari array traces, karena itu akan
  // menghilangkan entry-nya dari legend. Sebagai gantinya trace tetap dipertahankan dengan
  // `visible: "legendonly"` sehingga line tidak digambar di plot, namun entry legend tetap
  // tampil semi-transparan dan tetap bisa di-toggle kembali (klik pada legend).
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
  // Spectrum plots should always expose ticks through 20 kHz, even when JSON x_limits stop earlier.
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

  // 3. Konfigurasi layout yang membaca konfigurasi JSON akustik secara dinamis
  const layout = {
    // Keep the initial JSON range while preserving user zoom and pan changes.
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
      type: chartData.x_scale, // Otomatis menyesuaikan 'linear' atau 'log' (misal: log untuk Spectrum)
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
      type: "linear", // Sumbu Y tetap linear karena nilai log (dB) sudah dihitung langsung oleh backend
      range: chartData.y_limits, // Batas sumbu Y dinamis (Pascals [-1, 1] atau dB [-85, 5])
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
          // Sync legend → dropdown: klik item legend meng-update state hiddenChannels
          // di parent. Mengembalikan `false` membuat Plotly melewati toggle internalnya
          // (lihat clickOrDoubleClick di plotly.js), sehingga visibility trace
          // sepenuhnya dikendalikan oleh React state.
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
