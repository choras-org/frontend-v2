import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, GithubIcon } from "lucide-react";

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-circle-question-mark-icon lucide-circle-question-mark text-white size-6"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
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
