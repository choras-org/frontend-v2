import type { Auralization } from "@/types/auralization";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  AudioLinesIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  LoaderCircleIcon,
  PlayIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { http } from "@/libs/http";
import { useState } from "react";
import { AudioPlayer } from "react-audio-play";
import { formatFilename } from "@/helpers/file";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteAuralizationAudioFileMutation } from "@/store/auralizationApi";

type ConvolvedSoundPlayerProps = {
  auralization: Auralization;
};
export function ConvolvedSoundPlayer({ auralization }: ConvolvedSoundPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [deleteAuralizationAudioFile] = useDeleteAuralizationAudioFileMutation();

  const compareResults = useSelector((state: RootState) => state.simulation.compareResults);

  const generateAudio = async () => {
    // Request audio generation
    const { data } = await http({
      method: "POST",
      url: "/auralizations",
      data: {
        audioFileId: auralization.id,
        simulationId,
      },
    });

    // Check if audio generation is completed
    let audioGenerationCompleted = data.status === "Completed";

    // If not completed, poll the status endpoint until it is completed
    if (!audioGenerationCompleted) {
      while (true) {
        const { data: statusData } = await http({
          method: "GET",
          url: `/auralizations/${data.id}/status`,
        });

        if (statusData.status === "Completed") {
          audioGenerationCompleted = true;
          break;
        }

        if (statusData.status === "Failed") {
          throw new Error("Audio generation failed");
        }

        // Wait for a short period before checking the status again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Fetch the generated audio file
    const { data: audioData } = await http({
      method: "GET",
      url: `/auralizations/${data.id}/wav`,
      responseType: "arraybuffer",
    });

    return audioData;
  };

  const handlePlay = async () => {
    try {
      setLoading(true);

      // Generate the audio data
      const audioData = await generateAudio();

      // Create a Blob from the audio data and generate a URL for it
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      setAudioUrl(audioUrl);
    } catch (error) {
      toast.error("Failed to play the convolved sound.");
      console.error("Error playing convolved sound:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      // Generate the audio data
      const audioData = await generateAudio();

      // Create a Blob from the audio data and trigger download
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const downloadUrl = URL.createObjectURL(audioBlob);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = formatFilename(`convolved-sound-${auralization.name}.wav`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error("Failed to download the convolved sound.");
      console.error("Error downloading convolved sound:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAuralizationAudioFile({
        simulationId: Number(simulationId),
        auralizationId: auralization.id,
      }).unwrap();
      toast.success("Convolved sound deleted successfully");
    } catch {
      toast.error("Failed to delete convolved sound");
    }
  };

  return (
    <Item variant="outline" className="bg-white relative">
      <ItemMedia>
        <AudioLinesIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{auralization.name}</ItemTitle>
        {auralization.description && <ItemDescription>{auralization.description}</ItemDescription>}
      </ItemContent>

      <ItemActions className="justify-end">
        <Select
          onValueChange={(val) => {
            setSimulationId(val);
            setAudioUrl(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            {compareResults.map(
              (result, idx) =>
                result.simulationId && (
                  <SelectItem
                    key={`convolution-option-${result.id}-${result.simulationId}`}
                    value={result.simulationId.toString()}
                  >
                    Result {idx + 1}
                  </SelectItem>
                ),
            )}
          </SelectContent>
        </Select>
      </ItemActions>
      {audioUrl && (
        <ItemActions className="justify-end">
          <AudioPlayer src={audioUrl} className="!p-0 !h-9 !shadow-none w-96" />
        </ItemActions>
      )}
      {!audioUrl && (
        <ItemActions>
          <Button onClick={handlePlay} disabled={loading || !simulationId}>
            {loading ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            {loading ? "Processing..." : "Play"}
          </Button>
        </ItemActions>
      )}

      <ItemActions>
        <Button onClick={handleDownload} disabled={downloadLoading || !simulationId}>
          {downloadLoading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <DownloadIcon className="size-4" />
          )}
          {downloadLoading ? "Processing..." : "Download"}
        </Button>
      </ItemActions>
      {simulationId && auralization.isUserFile && (
        <ItemActions className="justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer">
              <EllipsisVerticalIcon className="text-black/50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="bg-white border rounded-md shadow-sm p-3 z-50"
            >
              <ConfirmDialog
                title="Delete Convolved Sound"
                description="Are you sure you want to delete this convolved sound? This action cannot be undone."
                onConfirm={handleDelete}
                confirmVariant="destructive"
                confirmLabel="Delete Sound"
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 cursor-pointer"
                  >
                    Delete Sound
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      )}
    </Item>
  );
}
