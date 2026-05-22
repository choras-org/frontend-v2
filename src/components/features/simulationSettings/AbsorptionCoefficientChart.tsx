interface AbsorptionCoefficientChartProps {
  coefficients: number[];
  size?: "sm" | "md";
}

export function AbsorptionCoefficientChart({
  coefficients,
  size = "md",
}: AbsorptionCoefficientChartProps) {
  const frequencyLabels = ["63Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz"];

  const chartHeight = size === "sm" ? "h-24" : "h-32";
  const barWidth = size === "sm" ? "w-2" : "w-3";
  const labelSize = size === "sm" ? "text-[9px]" : "text-xs";
  const valueSize = size === "sm" ? "text-[8px]" : "text-[10px]";

  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className={`flex justify-center items-end gap-2 ${chartHeight}`}>
        {coefficients.map((coeff, index) => (
          <div key={index} className="flex flex-col items-center gap-1 h-full">
            <div className="flex-1 flex items-end justify-center w-full">
              <div className="relative h-full w-full flex justify-center items-end">
                <div
                  className={`${barWidth} bg-choras-dark rounded-t transition-all`}
                  style={{
                    height: `${coeff * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className={`${labelSize} font-medium text-gray-600 text-center whitespace-nowrap`}>
              {frequencyLabels[index]}
            </div>
            <div className={`${valueSize} text-gray-500 text-center font-mono`}>
              {coeff.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
