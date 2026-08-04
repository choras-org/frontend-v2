import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SimulationSettingsErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationSettingsErrors: Record<string, string>;
  hideSimulationSettingErrors: boolean;
  onHideChange: (checked: boolean) => void;
  onProceed: () => void;
}

export function SimulationSettingsErrorDialog({
  open,
  onOpenChange,
  simulationSettingsErrors,
  hideSimulationSettingErrors,
  onHideChange,
  onProceed,
}: SimulationSettingsErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="min-w-[550px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Simulation Settings Errors</AlertDialogTitle>
          <AlertDialogDescription>
            The following parameters are outside of the defined ranges:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6">
          <ul className="list-disc list-inside">
            {Object.entries(simulationSettingsErrors).map(([param, message]) => (
              <li key={param}>{message}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          The simulation method might break. Are you sure you want to continue?
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dontShowAgain"
              checked={hideSimulationSettingErrors}
              onCheckedChange={onHideChange}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Don't show this message again
            </label>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onProceed}
              className="bg-choras-primary hover:bg-choras-primary/80 cursor-pointer"
            >
              Proceed Anyway
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
