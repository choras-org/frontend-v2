import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { useGetAuralizationsBySimulationIdQuery } from "@/store/auralizationApi";
import type { Auralization } from "@/types/auralization";

type ConvolvedSoundsProps = {
  simulationId: number;
  onSelect: (value: Auralization) => void;
};
export function ConvolvedSounds({ simulationId, onSelect }: ConvolvedSoundsProps) {
  const {
    data: auralizations,
    isLoading,
    isError,
  } = useGetAuralizationsBySimulationIdQuery(simulationId);

  if (isLoading) {
    return <Loading message="Loading audio files..." />;
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

  const handleSelect = (value: string) => {
    const selected = auralizations.find((a) => a.id.toString() === value);
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger className="!h-10 bg-white w-full">
        <SelectValue placeholder="Select audio" />
      </SelectTrigger>
      <SelectContent>
        {auralizations.map((auralization, index) => (
          <SelectItem key={index} value={auralization.id.toString()}>
            {auralization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
