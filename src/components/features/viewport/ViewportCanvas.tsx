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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ViewportCanvas({ modelUrl, modelId }: ViewportCanvasProps) {
  const [cameraType, setCameraType] = useState<"perspective" | "orthographic">("perspective");
  const [viewMode, setViewMode] = useState<"solid" | "ghosted" | "wireframe">("solid");
  const [gridDialogOpen, setGridDialogOpen] = useState(false);
  const [majorGridSize, setMajorGridSize] = useState(5);
  const [minorGridSize, setMinorGridSize] = useState(1);
  const [tempMajorGridSize, setTempMajorGridSize] = useState(5);
  const [tempMinorGridSize, setTempMinorGridSize] = useState(1);
  const { loadModelFromUrl, isModelLoaded, isLoading, error, setActiveModel } = useModelLoader();
  const { isRunning } = useSimulationRunnerContext();
  const orbitControlsRef = useRef<OrbitControlsType | null>(null);

  useEffect(() => {
    if (modelUrl && modelId) {
      if (!isModelLoaded(modelId)) {
        loadModelFromUrl(modelId, modelUrl).catch(console.error);
      } else {
        setActiveModel(modelId);
      }
    }
  }, [modelUrl, modelId, loadModelFromUrl, isModelLoaded, setActiveModel]);

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
        {isLoading(modelId) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Loading model...
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 z-20 bg-red-500 text-white px-4 py-2 rounded">
            Error: {error}
          </div>
        )}

        <Select
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "solid" | "ghosted" | "wireframe")}
        >
          <SelectTrigger className="absolute top-2 right-2 z-10 cursor-pointer text-sm w-30 border-choras-primary text-choras-primary [&>svg]:stroke-choras-primary hover:bg-accent">
            <SelectValue placeholder="View Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="ghosted">Ghosted</SelectItem>
            <SelectItem value="wireframe">Wireframe</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={toggleCameraType}
          variant="outline"
          size="sm"
          className="absolute top-14 right-2 z-10 cursor-pointer hover:bg-accent"
        >
          <span className="hidden sm:inline">
            {cameraType === "perspective" ? "Perspective" : "Orthographic"}
          </span>
          <span className="sm:hidden">{cameraType === "perspective" ? "Persp" : "Ortho"}</span>
        </Button>
        <Canvas
          key={cameraType}
          camera={{
            position: [-10, -10, 10],
            fov: 75,
            up: [0, 0, 1],
            ...(cameraType === "orthographic" && {
              zoom: 1,
              left: -10,
              right: 10,
              top: 10,
              bottom: -10,
            }),
          }}
          orthographic={cameraType === "orthographic"}
          style={{ background: "#596B6B" }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[1, 1, 1]} intensity={30} />
          <directionalLight position={[-1, -1, 1]} intensity={30} />
          <directionalLight position={[1, -1, 1]} intensity={30} />
          <directionalLight position={[-1, 1, 1]} intensity={30} />
          <directionalLight position={[1, 1, -1]} intensity={30} />
          <directionalLight position={[-1, 1, -1]} intensity={20} />
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
          <GizmoHelper alignment="top-right" margin={[60, 150]}>
            <GizmoViewport axisColors={["#f093fb", "#4ecdc4", "#667eea"]} labelColor="black" />
          </GizmoHelper>

          {modelId && <ModelRenderer modelId={modelId} viewMode={viewMode} />}
          <SourceVisualization orbitControlsRef={orbitControlsRef} />
          <ReceiverVisualization orbitControlsRef={orbitControlsRef} />
        </Canvas>
      </div>

      {/* Grid Info - Clickable */}
      <button
        onClick={openGridDialog}
        className="absolute top-[200px] right-2 z-10 text-white text-xs pt-2 hover:bg-white/10 rounded px-2 py-1 transition-colors cursor-pointer"
      >
        <div className="space-y-0.5">
          <div>
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
      {!isRunning && (
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
