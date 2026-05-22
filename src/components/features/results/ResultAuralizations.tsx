import { ImpulseResponsePlayer } from "./ImpulseResponsePlayer";
import { UploadConvolvedAudio } from "./UploadConvolvedAudio";
import { ConvolvedSoundPlayer } from "./ConvolvedSoundPlayer";
import { DownloadResult } from "./DownloadResult";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { useGetAuralizationsBySimulationIdQuery } from "@/store/auralizationApi";
import { useSelector } from "react-redux";
import { selectCompareSimulationIds, selectCompareResults } from "@/store/simulationSelector";

type ResultAuralizationsProps = {
  simulationId: number;
};
export function ResultAuralizations({ simulationId }: ResultAuralizationsProps) {
  const {
    data: auralizations,
    isLoading,
    isError,
  } = useGetAuralizationsBySimulationIdQuery(simulationId);
  const compareResults = useSelector(selectCompareResults);
  const compareResultIds = useSelector(selectCompareSimulationIds);

  console.log(compareResultIds, "<<<");

  if (isLoading) {
    return <Loading message="Loading audio files..." className="h-container justify-center" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load audio files</AlertDescription>
      </Alert>
    );
  }

  if (!auralizations || auralizations.length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>No audio files available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="h-full w-full p-8 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl text-choras-secondary font-inter font-bold mb-8">
          Impulse Response
        </h1>

        <DownloadResult
          triggerLabel="Download Impulse Response"
          simulationIds={compareResultIds}
          mode="auralizations"
        />
      </div>
      {compareResults.map(
        (result) =>
          result.simulationId && (
            <ImpulseResponsePlayer
              key={`ir-player-${result.id}-${result.simulationId}`}
              simulationId={result.simulationId}
              color={result.color}
            />
          ),
      )}

      <div className="flex justify-between mt-12">
        <h1 className="text-2xl text-choras-secondary font-inter font-bold">Convolved Sound</h1>
        <UploadConvolvedAudio simulationId={simulationId} />
      </div>
      {auralizations.map((auralization) => (
        <ConvolvedSoundPlayer
          key={`${auralization.id}-${simulationId}`}
          auralization={auralization}
        />
      ))}
    </div>
  );
}
