import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useUploadAudioFileMutation } from "@/store/auralizationApi";
import { cleanExt, formatBytes, getFileExt } from "@/helpers/file";

const UploadAudioSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().max(1000).optional(),
  file: z
    .instanceof(File, { message: "Please upload a file." })
    .refine((f: File) => f.size <= 20_000_000, { message: "Max file size is 20MB." })
    .refine((f: File) => /^audio\//.test(f.type), { message: "File must be an audio file." }),
});

type UploadAudioData = z.infer<typeof UploadAudioSchema>;

type UploadConvolvedAudioProps = {
  simulationId: number;
};

export function UploadConvolvedAudio({ simulationId }: UploadConvolvedAudioProps) {
  const [open, setOpen] = useState(false);
  const [uploadAudioFile, { isLoading }] = useUploadAudioFileMutation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<UploadAudioData>({
    resolver: zodResolver(UploadAudioSchema),
    defaultValues: { name: "", description: "", file: undefined },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      if (fileInputRef.current?.value) fileInputRef.current.value = "";
    }
  }, [open, form]);

  const handleSubmit = async (data: UploadAudioData) => {
    // UI-only for now. Implement actual upload logic later.
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("file", data.file);
      formData.append("simulation_id", simulationId.toString());
      formData.append("extension", getFileExt(data.file.name));
      await uploadAudioFile(formData).unwrap();
      toast.success("Audio uploaded (UI-only)");
      setOpen(false);
    } catch (error) {
      console.error("Failed to upload audio", error);
      toast.error("Failed to upload audio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Audio</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload Audio</DialogTitle>
              <DialogDescription>Upload a convolved audio file (WAV, MP3, etc.).</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Audio name" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div>
                        <label
                          htmlFor="audio-file-drop"
                          className={`relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                            fieldState.error
                              ? "border-destructive bg-red-50"
                              : "border-border hover:border-primary/50"
                          } ${field.value ? "hidden" : ""}`}
                        >
                          {/* Audio icon */}
                          <div className="w-12 h-12 mb-3 flex items-center justify-center bg-muted rounded-md">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                              />
                            </svg>
                          </div>
                          <span
                            className={`font-medium ${fieldState.error ? "text-destructive" : ""}`}
                          >
                            Drop your audio file here
                          </span>
                          <span
                            className={`text-xs text-muted-foreground ${
                              fieldState.error ? "text-destructive" : ""
                            }`}
                          >
                            or click to select a file (WAV, MP3, etc.)
                          </span>
                          <input
                            ref={fileInputRef}
                            id="audio-file-drop"
                            type="file"
                            accept="audio/*"
                            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                            onChange={(e) => {
                              const f =
                                e.target.files && e.target.files.length > 0
                                  ? e.target.files[0]
                                  : undefined;
                              field.onChange(f);

                              form.setValue("name", cleanExt(f?.name ?? ""), {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                            }}
                            disabled={isLoading}
                          />
                        </label>
                        {field.value && (
                          <div
                            className={`p-3 border rounded-md h-64 flex flex-col justify-center items-center gap-3 ${
                              isLoading ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            {/* Audio icon */}
                            <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                />
                              </svg>
                            </div>

                            {/* metadata */}
                            <div className="text-center">
                              <div className="font-medium">{field.value.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatBytes(field.value.size)}
                              </div>
                            </div>

                            {/* actions row */}
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                size="sm"
                                disabled={isLoading}
                              >
                                Change
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  // Reset file input value to allow re-uploading the same file if needed
                                  if (fileInputRef.current?.value) fileInputRef.current.value = "";

                                  // Reset field value
                                  field.onChange(undefined);
                                }}
                                disabled={isLoading}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Short description" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isLoading} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
