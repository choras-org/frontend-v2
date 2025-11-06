import { useGetImpulseResponseBySimulationIdQuery } from "@/store/auralizationApi";
import { useGetSimulationByIdQuery } from "@/store/simulationApi";
import WavesurferPlayer from "@wavesurfer/react";
import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import type WaveSurfer from "wavesurfer.js";

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
        renderFunction={renderFunction(color)}
        onReady={(wavesurfer) => {
          renderLabel(wavesurfer);
        }}
      />
    </div>
  );
}

const renderLabel = (wavesurfer: WaveSurfer) => {
  // Add timestamp label that follows the cursor
  const wrapper = wavesurfer.getWrapper();

  // Create timestamp label element
  const label = document.createElement("div");
  label.style.position = "absolute";
  label.style.top = "0px";
  label.style.padding = "2px 6px";
  label.style.background = "#555";
  label.style.color = "#fff";
  label.style.fontSize = "11px";
  label.style.pointerEvents = "none";
  label.style.zIndex = "10";
  wrapper.style.position = "relative";
  wrapper.appendChild(label);

  // Format time function
  const formatTime = (seconds: number) => {
    const ms = Math.floor((seconds % 1) * 1000);
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}:${ms.toString().padStart(3, "0")}`;
  };

  // Update label position on time update
  const updateLabel = () => {
    const currentTime = wavesurfer.getCurrentTime();
    const duration = wavesurfer.getDuration();
    const progress = currentTime / duration;
    const wrapperWidth = wrapper.clientWidth;
    const position = progress * wrapperWidth;

    label.textContent = formatTime(currentTime);
    label.style.left = `${Math.max(0, Math.min(position - 30, wrapperWidth - 70 + 10))}px`;
  };

  // Update on time change
  wavesurfer.on("timeupdate", updateLabel);
  wavesurfer.on("seeking", updateLabel);
  wavesurfer.on("ready", updateLabel);

  // Initial update
  updateLabel();
};

const renderFunction: (
  color: string,
) => (peaks: Array<Float32Array | number[]>, ctx: CanvasRenderingContext2D) => void =
  (color) => (channels, ctx) => {
    const { width, height } = ctx.canvas;
    const channel = channels[0];
    const step = 45; // Pixels per triangle

    ctx.translate(0, height / 2);

    // Draw horizontal centerline first
    ctx.strokeStyle = color; // Light gray
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();

    // Calculate how many samples per pixel
    const samplesPerPixel = channel.length / width;

    for (let x = 0; x < width; x += step * 2) {
      // Get the range of samples for this pixel region
      const startSample = Math.floor(x * samplesPerPixel);
      const endSample = Math.floor((x + step) * samplesPerPixel);

      // Find min and max in this range to capture peaks
      let max = 0;
      for (let i = startSample; i < endSample && i < channel.length; i++) {
        const absValue = Math.abs(channel[i]);
        if (absValue > max) max = absValue;
      }

      // Scale to canvas height
      const y = max * (height / 2 - 10);

      // Draw curved wave (upward) using bezier curve for smoother, rounder peaks
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + step * 0.25,
        y * 0.9, // First control point
        x + step * 0.4,
        y, // Second control point
        x + step / 2,
        y, // Peak
      );
      ctx.bezierCurveTo(
        x + step * 0.6,
        y, // First control point
        x + step * 0.75,
        y * 0.9, // Second control point
        x + step,
        0, // End point
      );

      // Draw curved wave (downward) using bezier curve for smoother, rounder peaks
      ctx.moveTo(x + step, 0);
      ctx.bezierCurveTo(
        x + step + step * 0.25,
        -y * 0.9, // First control point
        x + step + step * 0.4,
        -y, // Second control point
        x + step + step / 2,
        -y, // Peak
      );
      ctx.bezierCurveTo(
        x + step + step * 0.6,
        -y, // First control point
        x + step + step * 0.75,
        -y * 0.9, // Second control point
        x + step * 2,
        0, // End point
      );
    }

    ctx.stroke();
    ctx.closePath();
  };
