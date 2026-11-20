import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useModelLoader } from "@/hooks/useModelLoader";
import { ModelRenderer } from "./ModelRenderer";
import { GeometrySelectionInfo } from "./GeometrySelectionInfo";
import { SourceVisualization } from "./SourceVisualization";
import { ReceiverVisualization } from "./ReceiverVisualization";
import { RunSimulationButton } from "./RunSimulationButton";
import { CustomAxesHelper } from "./CustomAxesHelper";
import type { ViewportCanvasProps } from "@/types/modelViewport";
import { OrbitControls as OrbitControlsType } from "three-stdlib";
import { useSimulationRunnerContext } from "@/contexts/SimulationRunnerContext";
import { OrthographicCamera } from "three";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeometryIssueLayer } from "../GeometryIssueLayer";
import { useCameraFocusOnIssue } from "@/hooks/useCameraFocusOnIssue";
import { useGetSimulationRunsQuery } from "@/store/simulationApi";
import { Camera, Grid3X3, Layers3 } from "lucide-react";

export function ViewportCanvas({
  modelUrl,
  modelId,
  simulationId,
  cacheKey,
  useClone = false,
  isRepair = false,
  showGeometrySelectionInfo = true,
}: ViewportCanvasProps) {
  const [cameraType, setCameraType] = useState<"perspective" | "orthographic">("perspective");
  const [viewMode, setViewMode] = useState<"solid" | "ghosted" | "wireframe">("solid");
  const [gridDialogOpen, setGridDialogOpen] = useState(false);
  const [majorGridSize, setMajorGridSize] = useState(5);
  const [minorGridSize, setMinorGridSize] = useState(1);
  const [tempMajorGridSize, setTempMajorGridSize] = useState(5);
  const [tempMinorGridSize, setTempMinorGridSize] = useState(1);
  const { loadModelFromUrl, getModel, isLoading, error, setActiveModel } = useModelLoader();
  const { isRunning } = useSimulationRunnerContext();
  const orbitControlsRef = useRef<OrbitControlsType | null>(null);
  const { data: simulationsRun } = useGetSimulationRunsQuery();
  const currentSimulationRun = simulationsRun?.find(
    (sim) => sim.simulation.id === Number(simulationId),
  );

  useCameraFocusOnIssue(orbitControlsRef);

  const modelCacheKey = cacheKey ?? (modelId !== undefined ? String(modelId) : undefined);

  useEffect(() => {
    if (modelUrl && modelId && modelCacheKey) {
      const existing = getModel(modelCacheKey);
      // Reload when nothing is cached for this key yet, OR when the cached
      // model was loaded from a different URL (e.g. the repaired file becomes
      // available after the repair finishes). Keying only on cacheKey would
      // keep showing the stale (initial) model until a hard refresh.
      if (!existing || existing.sourceUrl !== modelUrl) {
        loadModelFromUrl(modelCacheKey, modelId, modelUrl).catch(console.error);
      } else {
        setActiveModel(modelId);
      }
    }
  }, [modelUrl, modelId, modelCacheKey, loadModelFromUrl, getModel, setActiveModel]);

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === "perspective" ? "orthographic" : "perspective"));
  };

  const openGridDialog = () => {
    setTempMajorGridSize(majorGridSize);
    setTempMinorGridSize(minorGridSize);
    setGridDialogOpen(true);
  };

  const saveGridSettings = () => {
    setMajorGridSize(tempMajorGridSize);
    setMinorGridSize(tempMinorGridSize);
    setGridDialogOpen(false);
  };

  const closeGridDialog = () => {
    setGridDialogOpen(false);
  };

  return (
    <div className="overflow-hidden relative touch-none h-container">
      <div className="h-full w-full relative">
        {isLoading(modelCacheKey) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Loading model...
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 z-20 bg-red-500 text-white px-4 py-2 rounded">
            Error: {error}
          </div>
        )}

        <div className="absolute right-3 top-3 z-20 w-40 rounded-md border border-slate-200 bg-white/95 p-2.5 text-slate-800 shadow-lg backdrop-blur-sm">
          <div className="mb-2">
            <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Display mode
            </span>
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "solid" | "ghosted" | "wireframe")}
            >
              <SelectTrigger
                aria-label="Display mode"
                className="h-9 w-full cursor-pointer border-slate-300 bg-white text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 [&>svg]:stroke-slate-600"
              >
                <Layers3 className="h-4 w-4 shrink-0 text-choras-primary" />
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="ghosted">Ghosted</SelectItem>
                <SelectItem value="wireframe">Wireframe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Camera</span>
          <Button
            onClick={toggleCameraType}
            variant="outline"
            size="sm"
            className="w-full cursor-pointer justify-start gap-2 border-slate-300 bg-white font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            <Camera className="h-4 w-4 shrink-0 text-choras-primary" />
            <span>{cameraType === "perspective" ? "Perspective" : "Orthographic"}</span>
          </Button>
        </div>
        <Canvas
          key={cameraType}
          camera={{
            position: [-10, -10, 10],
            fov: 75,
            up: [0, 0, 1],
          }}
          orthographic={cameraType === "orthographic"}
          style={{ background: "#596B6B" }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl, camera, size }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (cameraType === "orthographic") {
              const aspect = size.width / size.height;
              const height = 20;
              const width = height * aspect;

              const orthoCamera = camera as OrthographicCamera;
              orthoCamera.left = -width / 2;
              orthoCamera.right = width / 2;
              orthoCamera.top = height / 2;
              orthoCamera.bottom = -height / 2;
              orthoCamera.zoom = 1;
              orthoCamera.updateProjectionMatrix();
            }
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[1, 1, 1]} intensity={10} />
          <directionalLight position={[-1, -1, 1]} intensity={10} />
          <directionalLight position={[1, -1, 1]} intensity={10} />
          <directionalLight position={[-1, 1, 1]} intensity={10} />
          <directionalLight position={[1, 1, -1]} intensity={10} />
          <directionalLight position={[-1, 1, -1]} intensity={5} />
          <CustomAxesHelper size={50 / 2} />
          <Grid
            position={[0, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            args={[50, 50]}
            cellSize={minorGridSize}
            cellThickness={0.8}
            cellColor="#6B7D7D"
            sectionSize={majorGridSize}
            sectionThickness={0.8}
            sectionColor="#7B8D8D"
            infiniteGrid={false}
            fadeDistance={100}
            fadeStrength={1}
            side={2}
          />
          <OrbitControls
            ref={orbitControlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={false}
            dampingFactor={0}
            target={[0, 0, 0]}
            minDistance={1}
            maxDistance={1000}
            zoomSpeed={0.5}
          />
          <GizmoHelper alignment="top-left" margin={[70, 70]}>
            <GizmoViewport axisColors={["#EF7305", "#F4B183", "#FBE5D6"]} labelColor="black" />
          </GizmoHelper>

          {modelId && (
            <ModelRenderer
              modelId={modelId}
              cacheKey={modelCacheKey}
              viewMode={viewMode}
              useClone={useClone}
            />
          )}
          <GeometryIssueLayer isRepair={isRepair} />
          <SourceVisualization orbitControlsRef={orbitControlsRef} />
          <ReceiverVisualization orbitControlsRef={orbitControlsRef} />
        </Canvas>
      </div>

      {/* Grid Info - Clickable */}
      <button
        onClick={openGridDialog}
        className="absolute right-3 top-[200px] z-10 flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-left text-xs text-slate-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
      >
        <Grid3X3 className="mt-0.5 h-4 w-4 shrink-0 text-choras-primary" />
        <div className="space-y-0.5">
          <div className="font-semibold">
            Major grid: {majorGridSize}x{majorGridSize}m
          </div>
          <div>
            Minor grid: {minorGridSize}x{minorGridSize}m
          </div>
        </div>
      </button>

      {/* Run Simulation Button */}
      <div className="absolute bottom-6 left-18 right-18 z-10">
        <RunSimulationButton />
      </div>

      {/* Selection Info Panel */}
      {!isRunning && showGeometrySelectionInfo && currentSimulationRun?.status !== "Error" && (
        <div className="absolute bottom-4 right-4 z-10">
          <GeometrySelectionInfo />
        </div>
      )}

      {/* Grid Configuration Dialog */}
      <Dialog open={gridDialogOpen} onOpenChange={setGridDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grid Configuration</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Major Grid Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Major Grid Size (m)</label>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={tempMajorGridSize || ""}
                onChange={(e) =>
                  setTempMajorGridSize(e.target.value ? parseFloat(e.target.value) : 0)
                }
                placeholder="Enter size"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tempMajorGridSize > 0 && (
                <p className="text-xs text-gray-500">
                  Grid will be {tempMajorGridSize}x{tempMajorGridSize}m
                </p>
              )}
            </div>

            {/* Minor Grid Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minor Grid Size (m)</label>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={tempMinorGridSize || ""}
                onChange={(e) =>
                  setTempMinorGridSize(e.target.value ? parseFloat(e.target.value) : 0)
                }
                placeholder="Enter size"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tempMinorGridSize > 0 && (
                <p className="text-xs text-gray-500">
                  Grid will be {tempMinorGridSize}x{tempMinorGridSize}m
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeGridDialog}>
              Cancel
            </Button>
            <Button
              onClick={saveGridSettings}
              disabled={tempMajorGridSize <= 0 || tempMinorGridSize <= 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
