import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleHelp, FileText, GithubIcon } from "lucide-react";

type Method = {
  simulationType: string;
  label: string;
  description?: string;
  repositoryURL?: string;
  documentationURL?: string;
};

type MethodInfoDialogProps = {
  method?: Method;
};

export function MethodInfoDialog({ method }: MethodInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="px-2 hover:bg-white/10 ml-2">
          <CircleHelp className="size-6 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {method ? method.label.replace("method", "") : "Method Information"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-base whitespace-pre-wrap">
          {method?.description || "No description available for this method."}
        </DialogDescription>
        {method && (
          <div className="flex gap-3 mt-4">
            {method.repositoryURL && (
              <Button
                variant="outline"
                onClick={() => window.open(method.repositoryURL, "_blank")}
                className="flex-1"
              >
                <GithubIcon className="mr-2 h-4 w-4" />
                Open Repository
              </Button>
            )}
            {method.documentationURL && (
              <Button
                variant="outline"
                onClick={() => window.open(method.documentationURL, "_blank")}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Open Documentation
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
