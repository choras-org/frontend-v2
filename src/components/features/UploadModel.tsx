import { AudioLinesIcon, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

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
import { useFetchExampleModelsQuery } from "@/store/modelApi";
import type { ExampleModel } from "@/types/model";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// 3D Model renderer component
interface ModelRendererProps {
  file: File;
  onScreenshotReady: (blob: Blob) => void;
}

const UploadModelSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  file: z
    .instanceof(File, { message: "Please upload a file." })
    .refine((file: File) => file.size <= 100_000_000, { message: "Max file size is 100MB." })
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

function ModelRenderer({ file, onScreenshotReady }: ModelRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processModel = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x596b6b);

        const width = 720;
        const height = 480;

        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 10000);
        camera.position.set(0, 0, 100);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          preserveDrawingBuffer: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-100, -100, 100);
        scene.add(directionalLight2);

        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (fileExtension === "obj") {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const fileContent = e.target?.result as string;
              const loader = new OBJLoader();
              const object = loader.parse(fileContent);
              const modelGroup = new THREE.Group();

              object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  if (!child.geometry.attributes.normal) {
                    child.geometry.computeVertexNormals();
                  }

                  const material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    emissive: 0x555555,
                    shininess: 100,
                    side: THREE.DoubleSide,
                    flatShading: false,
                  });

                  child.material = material;
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });

              modelGroup.add(object);
              scene.add(modelGroup);

              const box = new THREE.Box3().setFromObject(modelGroup);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              const maxDim = Math.max(size.x, size.y, size.z);
              if (maxDim === 0 || maxDim === Infinity) {
                throw new Error("Model has no valid geometry");
              }

              const fov = camera.fov * (Math.PI / 180);
              let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
              cameraDistance *= 1.8;

              const horizontalAngle = Math.PI / 5;
              const verticalAngle = Math.PI / 8;

              camera.position.set(
                center.x + cameraDistance * Math.sin(horizontalAngle) * Math.cos(verticalAngle),
                center.y + cameraDistance * Math.sin(verticalAngle) * 0.8,
                center.z + cameraDistance * Math.cos(horizontalAngle) * Math.cos(verticalAngle),
              );
              camera.lookAt(center);
              camera.updateProjectionMatrix();

              renderer.render(scene, camera);

              setTimeout(() => {
                canvas.toBlob((blob) => {
                  if (blob && blob.size > 0) {
                    onScreenshotReady(blob);
                  } else {
                    toast.error("Failed to capture screenshot");
                  }
                  renderer.dispose();
                }, "image/png");
              }, 300);
            } catch (error) {
              console.error("Error parsing OBJ:", error);
              toast.error(
                `Failed to parse 3D model: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
              renderer.dispose();
            }
          };

          reader.onerror = () => {
            toast.error("Failed to read file");
            renderer.dispose();
          };

          reader.readAsText(file);
        } else if (fileExtension === "dxf") {
          toast.warning("DXF preview not yet supported. Screenshot will be blank.");
          setTimeout(() => {
            renderer.render(scene, camera);
            canvas.toBlob((blob) => {
              if (blob) {
                onScreenshotReady(blob);
              }
              renderer.dispose();
            }, "image/png");
          }, 100);
        }
      } catch (error) {
        console.error("Error processing model:", error);
        toast.error("Failed to process model file");
      }
    };

    processModel();
  }, [file, onScreenshotReady]);

  return <canvas ref={canvasRef} style={{ display: "none" }} width={720} height={480} />;
}

export function UploadModel({ projectId, trigger, onSuccess }: UploadModelProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(false);
  const { data: exampleModels } = useFetchExampleModelsQuery();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm({
    resolver: zodResolver(UploadModelSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

  const handleSelectExampleModel = async (example: ExampleModel) => {
    if (selectedExampleId === example.id) return;

    try {
      setIsLoadingExample(true);
      setIsCapturingScreenshot(false); // Reset current capture trigger state to clean old cycle
      setSelectedExampleId(example.id);

      form.setValue("name", example.name, { shouldValidate: true });

      const response = await fetch(example.modelUrl);
      if (!response.ok) throw new Error("Failed to download example file.");

      const blob = await response.blob();
      const fileObject = new File([blob], example.fileName, { type: "text/plain" });

      setIsCapturingScreenshot(true); // Fire up capturing mode just before assigning file
      form.setValue("file", fileObject, { shouldValidate: true });
      toast.success(`Loaded ${example.name} successfully.`);
    } catch (error) {
      console.error("Error loading example model:", error);
      toast.error("Failed to load example model. Please try again.");
      setSelectedExampleId(null);
      setIsCapturingScreenshot(false);
    } finally {
      setIsLoadingExample(false);
    }
  };

  const handleUploadModelImage = async () => {
    const formData = new FormData();
    formData.append("file", screenshot as Blob, `model-screenshot-${Date.now()}.png`);
    const { data } = await http.post("/models/upload-image", formData, {
      withCredentials: false,
    });
    return data.imagePath;
  };

  const onSubmit = async (data: UploadModelData) => {
    try {
      setIsSubmitting(true);
      const { data: fileSlot } = await http.get("/files");

      const formData = new FormData();
      formData.append("file", data.file, data.file.name);
      const { data: uploadResult } = await http.post(fileSlot.uploadUrl, formData, {
        withCredentials: false,
      });

      await http.delete("/files", {
        params: { slot: fileSlot.id },
        withCredentials: false,
      });

      const { data: createGeometryCheckResult } = await http({
        method: "POST",
        url: "/geometryCheck",
        params: { fileUploadId: uploadResult.id },
      });

      const imagePath = await handleUploadModelImage();

      await http({
        method: "POST",
        url: "/models",
        data: {
          name: data.name,
          projectId: projectId,
          sourceFileId: createGeometryCheckResult.outputModelId,
          imagePath: imagePath,
        },
      });

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
    if (!open) {
      form.reset();
      setScreenshot(null);
      setSelectedExampleId(null);
      setIsCapturingScreenshot(false);
      if (fileInputRef.current?.value) fileInputRef.current.value = "";
    }
  }, [open, form]);

  return (
    <Dialog
      onOpenChange={(newOpen) => {
        if (!newOpen && (isCapturingScreenshot || isLoadingExample)) {
          return;
        }
        setOpen(newOpen);
      }}
      open={open}
    >
      <DialogTrigger asChild>{trigger ?? <Button>Upload Model</Button>}</DialogTrigger>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => {
          if (isCapturingScreenshot || isLoadingExample) {
            e.preventDefault();
          }
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload Model</DialogTitle>
              <DialogDescription>
                Upload your 3D model here. Accepted formats are OBJ or DXF.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              {/* 1. Name Input Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Model Name"
                        {...field}
                        disabled={isSubmitting || isLoadingExample}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. File Dropzone & Preview Field */}
              <FormField
                control={form.control}
                name="file"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div>
                        {field.value && (
                          <ModelRenderer
                            key={`${field.value.name}_${selectedExampleId || "manual"}`} // Fix race condition with unique key string
                            file={field.value}
                            onScreenshotReady={(blob) => {
                              setScreenshot(blob);
                              setIsCapturingScreenshot(false);
                              toast.success("Screenshot captured successfully.");
                            }}
                          />
                        )}
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
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
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
                          <span
                            className={cn("text-xs text-muted-foreground", {
                              "text-destructive": fieldState.error,
                            })}
                          >
                            max file size: 100MB
                          </span>
                          <input
                            ref={fileInputRef}
                            id="file-drop"
                            type="file"
                            accept=".obj,.dxf"
                            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                            disabled={isLoadingExample || isSubmitting}
                            onChange={(e) => {
                              e.stopPropagation();
                              const f =
                                e.target.files && e.target.files.length > 0
                                  ? e.target.files[0]
                                  : undefined;
                              if (f) {
                                setSelectedExampleId(null);
                                setIsCapturingScreenshot(true);
                              }
                              field.onChange(f);
                            }}
                          />
                        </label>
                        {field.value && (
                          <div
                            className={cn(
                              "p-3 border rounded-md h-64 flex flex-col justify-center items-center gap-3",
                              {
                                "opacity-50 pointer-events-none": isSubmitting || isLoadingExample,
                                "border-destructive": fieldState.error,
                                "bg-red-50": fieldState.error,
                              },
                            )}
                          >
                            <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                              <AudioLinesIcon />
                            </div>

                            <div className="text-center">
                              <div
                                className={cn("font-medium", {
                                  "text-destructive": fieldState.error,
                                })}
                              >
                                {field.value.name}
                              </div>
                              <div
                                className={cn("text-xs text-muted-foreground", {
                                  "text-destructive": fieldState.error,
                                })}
                              >
                                {formatBytes(field.value.size)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedExampleId(null);
                                  fileInputRef.current?.click();
                                }}
                                size="sm"
                              >
                                Change
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (fileInputRef.current?.value) fileInputRef.current.value = "";
                                  setSelectedExampleId(null);
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

              {/* 3. "OR" Divider */}
              <div className="relative my-4 flex py-1 items-center text-xs uppercase text-muted-foreground">
                <div className="flex-grow border-t" />
                <span className="mx-2 flex-shrink bg-background px-2 font-medium tracking-wider">
                  Or use quick example
                </span>
                <div className="flex-grow border-t" />
              </div>

              {/* 4. Example Models Grid List */}
              <div className="grid grid-cols-1 gap-2">
                {exampleModels?.map((example) => (
                  <div
                    key={example.id}
                    onClick={() =>
                      !isSubmitting && !isLoadingExample && handleSelectExampleModel(example)
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent",
                      {
                        "border-primary bg-primary/5 ring-1 ring-primary":
                          selectedExampleId === example.id,
                        "opacity-50 pointer-events-none": isSubmitting || isLoadingExample,
                      },
                    )}
                  >
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                      {example.thumbnailUrl ? (
                        <img
                          src={`${API_URL}/${example.thumbnailUrl}`}
                          alt={example.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <AudioLinesIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{example.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {example.description}
                      </div>
                    </div>
                    {selectedExampleId === example.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isSubmitting || isLoadingExample} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting || isCapturingScreenshot || isLoadingExample}
              >
                {isSubmitting
                  ? "Uploading..."
                  : isLoadingExample
                    ? "Loading Example..."
                    : isCapturingScreenshot
                      ? "Capturing..."
                      : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
