import { useGetImpulseResponseBySimulationIdQuery } from "@/store/auralizationApi";
import { useGetSimulationByIdQuery } from "@/store/simulationApi";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WavesurferPlayer from "@wavesurfer/react";
import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";

type ImpulseResponsePlayerProps = {
  simulationId: number;
  color: string;
};
export function ImpulseResponsePlayer({ simulationId, color }: ImpulseResponsePlayerProps) {
  const {
    data: impulseResponse,
    isLoading,
    isError,
  } = useGetImpulseResponseBySimulationIdQuery(simulationId);

  const { data: simulation } = useGetSimulationByIdQuery(simulationId);

  // Create a blob URL for the audio data
  const audioUrl = useMemo(() => {
    if (!impulseResponse) return null;
    const audioBlob = new Blob([impulseResponse], { type: "audio/wav" });
    return URL.createObjectURL(audioBlob);
  }, [impulseResponse]);

  if (isLoading) {
    return <Loading message="Loading impulse response..." />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load impulse response</AlertDescription>
      </Alert>
    );
  }

  // If no audio data, don't render anything
  if (!audioUrl || !simulation) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <WavesurferPlayer
        height={100}
        waveColor={color}
        url={audioUrl}
        dragToSeek={{ debounceTime: 5 }}
        mediaControls={true}
        plugins={[
          Hover.create({
            lineColor: "#ff0000",
            lineWidth: 2,
            labelBackground: "#555",
            labelColor: "#fff",
            labelSize: "11px",
            formatTimeCallback: (seconds: number) => {
              // format: mm:ss:ms
              const ms = Math.floor((seconds % 1) * 1000);
              const totalSeconds = Math.floor(seconds);
              const mins = Math.floor(totalSeconds / 60);
              const secs = totalSeconds % 60;
              return `${mins}:${secs.toString().padStart(2, "0")}:${ms.toString().padStart(3, "0")}`;
            },
          }),
        ]}
        renderFunction={(channels, ctx) => {
          const { width, height } = ctx.canvas;
          const scale = channels[0].length / width;
          const step = 10;

          ctx.translate(0, height / 2);
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 4; // Make lines thicker
          ctx.lineJoin = "miter"; // Sharp corners
          ctx.lineCap = "butt";
          ctx.beginPath();

          for (let i = 0; i < width; i += step * 2) {
            const index = Math.floor(i * scale);
            const value = Math.abs(channels[0][index]);
            let x = i;
            // Scale down the height to leave room
            let y = value * (height / 2 - step);

            // Draw sharp triangle wave (upward)
            ctx.moveTo(x, 0);
            ctx.lineTo(x + step / 2, y); // Peak at the middle
            ctx.lineTo(x + step, 0);

            // Draw sharp triangle wave (downward)
            x = x + step;
            y = -y;
            ctx.moveTo(x, 0);
            ctx.lineTo(x + step / 2, y); // Peak at the middle
            ctx.lineTo(x + step, 0);
          }

          ctx.stroke();
          ctx.closePath();
        }}
      />
    </div>
  );
}
