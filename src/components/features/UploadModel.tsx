import { AudioLinesIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/libs/style";
import { formatBytes } from "@/helpers/file";
import { http } from "@/libs/http";

const UploadModelSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  // single File expected (only .obj or .dxf)
  file: z
    .instanceof(File, { message: "Please upload a file." })
    .refine((file: File) => file.size <= 5_000_000, { message: "Max file size is 5MB." })
    .refine((file: File) => /\.(obj|dxf)$/i.test(file.name), {
      message: "Only .obj or .dxf files are accepted.",
    }),
});

type UploadModelData = z.infer<typeof UploadModelSchema>;

type UploadModelProps = {
  projectId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};
export function UploadModel({ projectId, trigger, onSuccess }: UploadModelProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm({
    resolver: zodResolver(UploadModelSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

  const onSubmit = async (data: UploadModelData) => {
    try {
      setIsSubmitting(true);
      // 1. get file slot /files
      const { data: fileSlot } = await http.get("/files");
      console.log(fileSlot, "<<< fileSlot");

      // 2. upload file to that slot
      const formData = new FormData();
      formData.append("file", data.file, data.file.name);
      const { data: uploadResult } = await http.post(fileSlot.uploadUrl, formData, {
        withCredentials: false,
      });
      console.log(uploadResult, "<<< uploadResult");

      // 3. delete file slot
      const { data: deleteResult } = await http.delete("/files", {
        params: {
          slot: fileSlot.id,
        },
        withCredentials: false,
      });
      console.log(deleteResult, "<<< deleteResult");

      // 4. geometry check by upload id
      const { data: createGeometryCheckResult } = await http({
        method: "POST",
        url: "/geometryCheck",
        params: {
          fileUploadId: uploadResult.id,
        },
      });
      console.log(createGeometryCheckResult, "<<< createGeometryCheckResult");

      // FYI:
      // somehow, the legacy code use `GET /geometryCheck` to check the result with polling every 2 seconds
      // also they call the endpoint `GET /geometryCheck/result?taskId=x` to get the final result
      // then i check the backend code, seems the process of geomeryCheck is synchronous and no need to polling
      // so after calling `POST /geometryCheck` we can directly use the result to create the model

      const { data: modelCreateResult } = await http({
        method: "POST",
        url: "/models",
        params: {
          name: data.name,
          projectId: projectId,
          sourceFileId: createGeometryCheckResult.outputModelId,
        },
      });
      console.log(modelCreateResult, "<<< modelCreateResult");

      setOpen(false);
      onSuccess?.();
      toast.success("Model uploaded successfully.");
    } catch (_) {
      toast.error("Error uploading model. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // reset form when dialog is closed
    if (!open) {
      form.reset();
      if (fileInputRef.current?.value) fileInputRef.current.value = "";
    }
  }, [open, form]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger ?? <Button>Upload Model</Button>}</DialogTrigger>
      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload Model</DialogTitle>
              <DialogDescription>
                Upload your 3D model here. Accepted formats are OBJ or DXF.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Model Name" {...field} disabled={isSubmitting} />
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
                          htmlFor="file-drop"
                          className={cn(
                            "relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                            {
                              "border-destructive": fieldState.error,
                              "bg-red-50": fieldState.error,
                              hidden: field.value,
                            },
                          )}
                        >
                          {/* file icon */}
                          <div className="w-12 h-12 mb-3 flex items-center justify-center bg-muted rounded-md">
                            <AudioLinesIcon />
                          </div>
                          <span
                            className={cn("font-medium", { "text-destructive": fieldState.error })}
                          >
                            Drop your .obj or .dxf file here
                          </span>
                          <span
                            className={cn("text-xs text-muted-foreground", {
                              "text-destructive": fieldState.error,
                            })}
                          >
                            or click to select a file
                          </span>
                          <input
                            ref={fileInputRef}
                            id="file-drop"
                            type="file"
                            accept=".obj,.dxf"
                            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                            onChange={(e) => {
                              const f =
                                e.target.files && e.target.files.length > 0
                                  ? e.target.files[0]
                                  : undefined;

                              field.onChange(f);
                            }}
                          />
                        </label>
                        {field.value && (
                          <div
                            className={cn(
                              "p-3 border rounded-md h-64 flex flex-col justify-center items-center gap-3",
                              {
                                "opacity-50 pointer-events-none": isSubmitting,
                              },
                            )}
                          >
                            {/* file icon */}
                            <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                              <AudioLinesIcon />
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
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isSubmitting} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
