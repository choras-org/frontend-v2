import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type ConfirmDialogProps = {
  // Visual content
  title: React.ReactNode;
  description?: React.ReactNode;

  // Buttons
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "secondary" | "outline" | "ghost" | "link";
  footer?: React.ReactNode; // Custom footer (buttons)

  // Trigger element
  trigger?: React.ReactNode;

  // Behavior
  onConfirm?: () => Promise<void> | void; // async or sync handler
  disabled?: boolean;
  autoCloseOnSuccess?: boolean; // default: true
  onOpenChange?: (open: boolean) => void;

  // Optional: allow external control if needed
  open?: boolean;
  defaultOpen?: boolean;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  trigger,
  onConfirm,
  disabled = false,
  autoCloseOnSuccess = true,
  onOpenChange,
  open: controlledOpen,
  defaultOpen,
  footer,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!!defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [isProcessing, setIsProcessing] = useState(false);

  const setOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Prevent closing while processing to keep feedback visible
    if (isProcessing) return;
    setOpen(nextOpen);
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm?.();
      if (autoCloseOnSuccess) setOpen(false);
    } catch {
      // Do not auto-close on error; caller can show toasts
      // We intentionally do not log here to avoid leaking
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button disabled={disabled} variant={confirmVariant}>
            {confirmLabel}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          {footer ?? (
            <>
              <AlertDialogCancel disabled={isProcessing}>{cancelLabel}</AlertDialogCancel>

              {/* Use a regular Button for the confirm action so Radix doesn't auto-close
              the dialog before our async handler finishes. */}
              <Button
                onClick={handleConfirm}
                disabled={isProcessing || disabled}
                aria-busy={isProcessing}
                variant={confirmVariant}
              >
                {isProcessing ? `${confirmLabel}…` : confirmLabel}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
