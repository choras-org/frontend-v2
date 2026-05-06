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

  // State for non-convolved (dry) audio
  const [nonConvolvedAudioUrl, setNonConvolvedAudioUrl] = useState<string | null>(null);
  const [nonConvolvedLoading, setNonConvolvedLoading] = useState(false);
  const [nonConvolvedDownloadLoading, setNonConvolvedDownloadLoading] = useState(false);

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

  const handlePlayConvolved = async () => {
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

  const handleDownloadConvolved = async () => {
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

  const handlePlayNonConvolved = async () => {
    try {
      setNonConvolvedLoading(true);

      // Fetch the non-convolved audio file
      const { data: audioData } = await http({
        method: "GET",
        url: `/auralizations/audiofiles/${auralization.id}/wav`,
        responseType: "arraybuffer",
      });

      // Create a Blob from the audio data and generate a URL for it
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      setNonConvolvedAudioUrl(audioUrl);
    } catch (error) {
      toast.error("Failed to play the non-convolved sound.");
      console.error("Error playing non-convolved sound:", error);
    } finally {
      setNonConvolvedLoading(false);
    }
  };

  const handleDownloadNonConvolved = async () => {
    try {
      setNonConvolvedDownloadLoading(true);

      // Fetch the non-convolved audio file
      const { data: audioData } = await http({
        method: "GET",
        url: `/auralizations/audiofiles/${auralization.id}/wav`,
        responseType: "arraybuffer",
      });

      // Create a Blob from the audio data and trigger download
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const downloadUrl = URL.createObjectURL(audioBlob);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = formatFilename(`non-convolved-${auralization.name}.wav`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error("Failed to download the non-convolved sound.");
      console.error("Error downloading non-convolved sound:", error);
    } finally {
      setNonConvolvedDownloadLoading(false);
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
          <Button onClick={handlePlayConvolved} disabled={loading || !simulationId} size={"sm"}>
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
        <Button
          onClick={handleDownloadConvolved}
          disabled={downloadLoading || !simulationId}
          size={"sm"}
        >
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

      {simulationId && (
        <div className="w-full border-t pt-4 bg-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">DRY SOURCE</h3>
              <p className="text-xs text-gray-600">Original audio before room simulation</p>
            </div>
            <div className="flex items-center gap-2">
              {nonConvolvedAudioUrl && (
                <AudioPlayer
                  src={nonConvolvedAudioUrl}
                  className="!p-2 !h-9 !shadow-none w-96 !bg-gray-200"
                />
              )}
              {!nonConvolvedAudioUrl && (
                <Button
                  onClick={handlePlayNonConvolved}
                  disabled={nonConvolvedLoading}
                  variant="outline"
                  size={"sm"}
                >
                  {nonConvolvedLoading ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <PlayIcon className="size-4" />
                  )}
                  {nonConvolvedLoading ? "Processing..." : "Play"}
                </Button>
              )}
              <Button
                onClick={handleDownloadNonConvolved}
                disabled={nonConvolvedDownloadLoading}
                variant="outline"
                size={"sm"}
              >
                {nonConvolvedDownloadLoading ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                {nonConvolvedDownloadLoading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Item>
  );
}
