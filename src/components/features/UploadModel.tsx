import { AudioLinesIcon } from "lucide-react";
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

// 3D Model renderer component
interface ModelRendererProps {
  file: File;
  onScreenshotReady: (blob: Blob) => void;
}

const UploadModelSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  // single File expected (only .obj or .dxf)
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

        // Setup Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x596b6b);

        // Use 3:2 aspect ratio to match ModelCard display (720x480)
        const width = 720;
        const height = 480;

        // Use lower FOV for less distortion and more isometric look
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

        // Lighting
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
          // Read file as text
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const fileContent = e.target?.result as string;
              const loader = new OBJLoader();

              // Parse OBJ content directly
              const object = loader.parse(fileContent);

              // Create a container for the model
              const modelGroup = new THREE.Group();

              // Process all geometries
              object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  // Compute vertex normals if not present
                  if (!child.geometry.attributes.normal) {
                    child.geometry.computeVertexNormals();
                  }

                  // Create a proper material if missing or default
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

              // Compute bounding box
              const box = new THREE.Box3().setFromObject(modelGroup);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              // Check if model has actual geometry
              const maxDim = Math.max(size.x, size.y, size.z);
              if (maxDim === 0 || maxDim === Infinity) {
                throw new Error("Model has no valid geometry");
              }

              // Fit camera to geometry with better positioning for isometric-like view
              const fov = camera.fov * (Math.PI / 180);
              let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
              cameraDistance *= 1.8;

              // Position camera at an angle for better 3D view with more top-down perspective
              const horizontalAngle = Math.PI / 5; // ~36 degrees horizontal
              const verticalAngle = Math.PI / 8; // ~22.5 degrees from horizontal

              camera.position.set(
                center.x + cameraDistance * Math.sin(horizontalAngle) * Math.cos(verticalAngle),
                center.y + cameraDistance * Math.sin(verticalAngle) * 0.8,
                center.z + cameraDistance * Math.cos(horizontalAngle) * Math.cos(verticalAngle),
              );
              camera.lookAt(center);
              camera.updateProjectionMatrix();

              // Render and capture
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
          // For DXF, we would need dxf-parser and conversion to Three.js
          // For now, show a placeholder
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

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "none",
      }}
      width={720}
      height={480}
    />
  );
}

export function UploadModel({ projectId, trigger, onSuccess }: UploadModelProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm({
    resolver: zodResolver(UploadModelSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

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
      // 1. get file slot /files
      const { data: fileSlot } = await http.get("/files");

      // 2. upload file to that slot
      const formData = new FormData();
      formData.append("file", data.file, data.file.name);
      const { data: uploadResult } = await http.post(fileSlot.uploadUrl, formData, {
        withCredentials: false,
      });

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

      const imagePath = await handleUploadModelImage();

      const { data: modelCreateResult } = await http({
        method: "POST",
        url: "/models",
        data: {
          name: data.name,
          projectId: projectId,
          sourceFileId: createGeometryCheckResult.outputModelId,
          imagePath: imagePath,
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
      setScreenshot(null);
      if (fileInputRef.current?.value) fileInputRef.current.value = "";
    }
  }, [open, form]);

  return (
    <Dialog
      onOpenChange={(newOpen) => {
        // Prevent closing while capturing screenshot
        if (!newOpen && isCapturingScreenshot) {
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
          // Prevent closing while capturing screenshot
          if (isCapturingScreenshot) {
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
                        {field.value && (
                          <ModelRenderer
                            key={field.value.name}
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
                            onChange={(e) => {
                              e.stopPropagation();
                              const f =
                                e.target.files && e.target.files.length > 0
                                  ? e.target.files[0]
                                  : undefined;

                              if (f) {
                                setIsCapturingScreenshot(true);
                                console.log("File selected:", f.name);
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
                                "opacity-50 pointer-events-none": isSubmitting,
                                "border-destructive": fieldState.error,
                                "bg-red-50": fieldState.error,
                              },
                            )}
                          >
                            {/* file icon */}
                            <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                              <AudioLinesIcon />
                            </div>

                            {/* metadata */}
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
              <Button type="submit" disabled={isSubmitting || isCapturingScreenshot}>
                {isSubmitting ? "Uploading..." : isCapturingScreenshot ? "Capturing..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
