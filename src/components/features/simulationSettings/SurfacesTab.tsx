import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import { useGetSimulationByIdQuery, useUpdateSimulationMutation } from "@/store/simulationApi";
import { useDispatch, useSelector } from "react-redux";
import { useGeometrySelection } from "@/hooks/useGeometrySelection";
import { useMeshHighlight } from "@/hooks/useMeshHighlight";
import { getAbsorptionColor, calculateAverageAbsorption } from "@/helpers/colorGradient";
import * as THREE from "three";
import type { RootState } from "@/store";
import {
  assignMaterial,
  removeMaterialAssignment,
  clearAllAssignments,
  setAssignments,
} from "@/store/materialAssignmentSlice";
import { setHighlightedElement } from "@/store/tabSlice";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SurfaceInfo } from "@/types/material";
import { ChevronRight, Eye, EyeOff, Plus } from "lucide-react";
import { SurfaceMaterialList } from "./SurfaceMaterialList";
import { AbsorptionCoefficientChart } from "./AbsorptionCoefficientChart";
import { Button } from "@/components/ui/button";
import { FullSettingJsonEditor } from "./FullSettingJsonEditor";

export function SurfacesTab() {
  const dispatch = useDispatch();
  const surfaces = useSurfaces();
  const [showIndividualAssignments, setShowIndividualAssignments] = useState(false);
  const [hiddenSurfaces, setHiddenSurfaces] = useState<Set<string>>(new Set());
  const selectedSurfaceRowRef = useRef<HTMLTableRowElement>(null);
  const {
    selectGeometry,
    addHighlightedMesh,
    removeHighlightedMesh,
    addSelectedGeometry,
    removeSelectedGeometry,
    clearSelectedGeometries,
  } = useGeometrySelection();
  const { highlightMesh, restoreOriginalColor, setMeshBaseColor, HIGHLIGHT_COLOR } =
    useMeshHighlight();
  const {
    data: materials = [],
    isLoading: materialsLoading,
    error: materialsError,
  } = useGetMaterialsQuery();
  const materialAssignments = useSelector(
    (state: RootState) => state.materialAssignment.assignments,
  );
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const highlightedElement = useSelector((state: RootState) => state.tab.highlightedElement);
  const { selectedGeometry, selectedGeometries } = useSelector(
    (state: RootState) => state.geometrySelection,
  );
  const { data: simulation, error: simulationError } = useGetSimulationByIdQuery(
    activeSimulation?.id ?? 0,
    {
      skip: !activeSimulation?.id,
    },
  );
  const [updateSimulation] = useUpdateSimulationMutation();
  const [openMaterialLibrary, setOpenMaterialLibrary] = useState(false);
  const [openCreateMaterialDialog, setOpenCreateMaterialDialog] = useState(false);
  const [bulkMaterialId, setBulkMaterialId] = useState<string>("");

  useEffect(() => {
    if (simulation?.layerIdByMaterialId) {
      dispatch(setAssignments(simulation.layerIdByMaterialId));
    }
  }, [simulation?.layerIdByMaterialId, dispatch]);

  useEffect(() => {
    if (simulationError) {
      toast.error("Cannot load simulation data. Material assignments will not be saved.");
    }
  }, [simulationError]);

  // Clear highlighting after 3 seconds
  useEffect(() => {
    if (highlightedElement) {
      const timer = setTimeout(() => {
        dispatch(setHighlightedElement(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedElement, dispatch]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>(null);

  const updateSimulationData = useCallback(
    async (assignments?: Record<string, number>) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!activeSimulation?.id) {
          console.warn("Cannot update simulation: No active simulation");
          toast.error("No active simulation to update");
          return;
        }

        if (!simulation) {
          console.warn("Cannot update simulation: Simulation data not loaded");
          toast.error("Simulation data not available");
          return;
        }

        if (!currentModelId) {
          console.warn("Cannot update simulation: No current model ID");
          toast.error("Model data not available");
          return;
        }

        const assignmentsToSave = assignments || materialAssignments;

        const updatePayload = {
          id: activeSimulation.id,
          body: {
            modelId: currentModelId,
            name: simulation.name,
            status: simulation.status,
            hasBeenEdited: true,
            layerIdByMaterialId: assignmentsToSave,
          },
        };

        try {
          await updateSimulation(updatePayload).unwrap();
          toast.success("Material assignments saved");
        } catch (error) {
          console.error("Failed to update simulation:", error);
          toast.error("Failed to save material assignment");
        }
      }, 300);
    },
    [activeSimulation?.id, simulation, currentModelId, materialAssignments, updateSimulation],
  );

  const handleMaterialAssignment = async (surfaceKey: string, materialId: string) => {
    if (materialId === "open-library") {
      setOpenMaterialLibrary(true);
      return;
    }

    let updatedAssignments: Record<string, number>;
    const surface = surfaces.find((s) => s.id === surfaceKey);

    if (materialId === "default") {
      dispatch(removeMaterialAssignment(surfaceKey));
      updatedAssignments = { ...materialAssignments };
      delete updatedAssignments[surfaceKey];

      if (surface?.mesh) {
        setMeshBaseColor(surface.mesh, 0xffffff);
      }
    } else {
      const numMaterialId = parseInt(materialId);
      dispatch(assignMaterial({ meshId: surfaceKey, materialId: numMaterialId }));
      updatedAssignments = { ...materialAssignments, [surfaceKey]: numMaterialId };

      if (surface?.mesh) {
        const material = materials.find((m) => m.id === numMaterialId);
        if (material?.absorptionCoefficients) {
          const avgAbsorption = calculateAverageAbsorption(material.absorptionCoefficients);
          const absorptionColor = getAbsorptionColor(avgAbsorption);
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      }
    }

    updateSimulationData(updatedAssignments);
  };

  const handleAssignAllMaterials = async (materialId: string) => {
    if (materialId === "open-library") {
      setOpenMaterialLibrary(true);
      return;
    }

    let updatedAssignments: Record<string, number>;
    const material = materials.find((m) => m.id === parseInt(materialId));

    if (materialId === "default") {
      dispatch(clearAllAssignments());
      updatedAssignments = {};

      surfaces.forEach((surface) => {
        if (surface.mesh) {
          setMeshBaseColor(surface.mesh, 0xffffff);
        }
      });
    } else {
      const newAssignments: Record<string, number> = {};
      const numMaterialId = parseInt(materialId);
      const avgAbsorption = material?.absorptionCoefficients
        ? calculateAverageAbsorption(material.absorptionCoefficients)
        : 0;
      const absorptionColor = getAbsorptionColor(avgAbsorption);

      surfaces.forEach((surface) => {
        const surfaceKey = surface.id;
        dispatch(assignMaterial({ meshId: surfaceKey, materialId: numMaterialId }));
        newAssignments[surfaceKey] = numMaterialId;

        if (surface.mesh) {
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });
      updatedAssignments = { ...materialAssignments, ...newAssignments };
    }

    updateSimulationData(updatedAssignments);
  };

  const getMaterialName = (materialId?: number) => {
    if (!materialId) return "Default";
    const material = materials.find((m) => m.id === materialId);
    return material?.name || "Unknown Material";
  };

  const isMaterialsMixed = () => {
    if (surfaces.length === 0) return false;

    const allMaterials = surfaces.map((surface) => {
      const surfaceKey = surface.id;
      return materialAssignments[surfaceKey];
    });

    const uniqueMaterials = new Set(allMaterials);

    return uniqueMaterials.size > 1;
  };

  const getDisplayName = (surface: SurfaceInfo, index: number) => {
    if (surface.name && surface.name !== `Surface ${surface.meshId}`) {
      return surface.name;
    }
    return `Surface [${index + 1}]`;
  };

  const getAssignAllValue = () => {
    if (surfaces.length === 0) return "default";

    if (isMaterialsMixed()) {
      return "mixed";
    }

    const assignedMaterials = surfaces.map((surface) => {
      const surfaceKey = surface.id;
      return materialAssignments[surfaceKey];
    });

    const firstMaterial = assignedMaterials[0];
    const allSame = assignedMaterials.every((materialId) => materialId === firstMaterial);

    if (allSame && firstMaterial !== undefined) {
      return firstMaterial.toString();
    }

    return "default";
  };

  const toggleSurfaceVisibility = (surfaceId: string) => {
    setHiddenSurfaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(surfaceId)) {
        newSet.delete(surfaceId);
      } else {
        newSet.add(surfaceId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    surfaces.forEach((surface) => {
      if (surface.mesh) {
        surface.mesh.visible = !hiddenSurfaces.has(surface.id);
      }
    });
  }, [surfaces, hiddenSurfaces]);

  const handleOpenCreateMaterialDialog = () => {
    setOpenMaterialLibrary(true);
    setTimeout(() => {
      setOpenCreateMaterialDialog(true);
    }, 500);
  };

  const getSelectedSurfaceId = (): string | null => {
    if (!selectedGeometry?.mesh) return null;

    const selectedMesh = selectedGeometry.mesh;
    const matchedSurface = surfaces.find(
      (surface) => surface.mesh === selectedMesh || surface.mesh.uuid === selectedMesh.uuid,
    );

    return matchedSurface?.id || null;
  };

  const selectedSurfaceId = getSelectedSurfaceId();

  useEffect(() => {
    if (selectedSurfaceId && !showIndividualAssignments) {
      setShowIndividualAssignments(true);
    }

    if (selectedSurfaceId && showIndividualAssignments && selectedSurfaceRowRef.current) {
      setTimeout(() => {
        selectedSurfaceRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  }, [selectedSurfaceId, showIndividualAssignments]);

  const handleSelectSurface = useCallback(
    (surface: SurfaceInfo) => {
      // Restore previous mesh if it exists
      if (selectedGeometry?.mesh) {
        removeHighlightedMesh(selectedGeometry.mesh);
        restoreOriginalColor(selectedGeometry.mesh);
      }

      // Highlight and select new mesh
      const payload = {
        mesh: surface.mesh,
        faceIndex: 0,
        point: new THREE.Vector3(),
        materialId: surface.id,
      };
      selectGeometry(payload);
      highlightMesh(surface.mesh, HIGHLIGHT_COLOR);
      addHighlightedMesh(surface.mesh);
      clearSelectedGeometries();
      addSelectedGeometry(payload);
    },
    [
      selectedGeometry,
      selectGeometry,
      highlightMesh,
      HIGHLIGHT_COLOR,
      addHighlightedMesh,
      removeHighlightedMesh,
      restoreOriginalColor,
    ],
  );

  const handleSelectMultipleSurfaces = useCallback(
    (surface: SurfaceInfo) => {
      const selectedGeo = selectedGeometries[surface.mesh.uuid];
      const mesh = surface.mesh;
      setBulkMaterialId("");
      if (selectedGeo) {
        removeSelectedGeometry(surface.mesh.uuid);
        removeHighlightedMesh(mesh);
        restoreOriginalColor(mesh);

        const remainingSelectedIds = Object.keys(selectedGeometries).filter(
          (id) => id !== surface.mesh.uuid,
        );
        if (remainingSelectedIds.length > 0) {
          const lastSelectedId = remainingSelectedIds[remainingSelectedIds.length - 1];
          const lastSelectedGeo = selectedGeometries[lastSelectedId];
          selectGeometry(lastSelectedGeo);
        } else {
          selectGeometry(null);
        }
      } else {
        const payload = {
          mesh: surface.mesh,
          faceIndex: 0,
          point: new THREE.Vector3(),
          materialId: surface.id,
        };
        addSelectedGeometry(payload);
        selectGeometry(payload);
        highlightMesh(mesh, HIGHLIGHT_COLOR);
        addHighlightedMesh(mesh);
      }
    },
    [selectedGeometries, addSelectedGeometry, removeSelectedGeometry],
  );

  const handleAssignBulkMaterials = async (materialId: string) => {
    if (materialId === "") {
      return;
    }

    if (materialId === "open-library") {
      setOpenMaterialLibrary(true);
      return;
    }

    setBulkMaterialId(materialId);
    let updatedAssignments: Record<string, number>;
    const material = materials.find((m) => m.id === parseInt(materialId));

    if (materialId === "default") {
      const numMaterialId = parseInt(materialId);
      const newAssignments: Record<string, number> = {};

      surfaces.forEach((surface) => {
        if (selectedGeometries[surface.mesh.uuid]) {
          const surfaceKey = surface.id;
          dispatch(assignMaterial({ meshId: surfaceKey, materialId: numMaterialId }));
          newAssignments[surfaceKey] = numMaterialId;
          setMeshBaseColor(surface.mesh, 0xffffff);
        }
      });

      updatedAssignments = { ...materialAssignments, ...newAssignments };
    } else {
      const newAssignments: Record<string, number> = {};
      const numMaterialId = parseInt(materialId);
      const avgAbsorption = material?.absorptionCoefficients
        ? calculateAverageAbsorption(material.absorptionCoefficients)
        : 0;
      const absorptionColor = getAbsorptionColor(avgAbsorption);

      surfaces.forEach((surface) => {
        if (selectedGeometries[surface.mesh.uuid]) {
          const surfaceKey = surface.id;
          dispatch(assignMaterial({ meshId: surfaceKey, materialId: numMaterialId }));
          newAssignments[surfaceKey] = numMaterialId;
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });

      updatedAssignments = { ...materialAssignments, ...newAssignments };
    }

    updateSimulationData(updatedAssignments);
  };

  const materialSelectOptions = useMemo(() => {
    if (materialsLoading) {
      return (
        <SelectItem value="loading" disabled className="text-gray-400">
          Loading materials...
        </SelectItem>
      );
    }

    if (materialsError) {
      return (
        <SelectItem value="error" disabled className="text-red-400">
          Error loading materials
        </SelectItem>
      );
    }

    return (
      <>
        {materials.map((material) => (
          <Tooltip key={material.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <SelectItem value={material.id.toString()} className="text-white">
                <span className="truncate block" title={material.name}>
                  {material.name}
                </span>
              </SelectItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="p-3 bg-choras-dark border-choras-primary">
              <div className="text-sm mb-2 font-medium text-white">{material.name}</div>
              <AbsorptionCoefficientChart
                coefficients={material.absorptionCoefficients}
                size="md"
              />
            </TooltipContent>
          </Tooltip>
        ))}
        <hr className="border-t border-gray-700 my-1" />
        <SelectItem value="open-library" className="text-choras-primary">
          Open material library
        </SelectItem>
      </>
    );
  }, [materials, materialsLoading, materialsError]);

  return (
    <div className="text-white h-full flex flex-col justify-between">
      <div>
        <div className="mb-4 flex justify-between items-center mt-2">
          <h4 className="text-xl text-choras-primary">Surfaces</h4>
          <SurfaceMaterialList
            openMaterialLibrary={openMaterialLibrary}
            setOpenMaterialLibrary={setOpenMaterialLibrary}
            openCreateMaterialDialog={openCreateMaterialDialog}
            setOpenCreateMaterialDialog={setOpenCreateMaterialDialog}
          />
        </div>

        {surfaces.length === 0 ? (
          <div className="text-gray-400 text-sm italic">No model loaded or no surfaces found</div>
        ) : (
          <div
            className={`overflow-hidden transition-all duration-500 ${
              highlightedElement === "material-assignment"
                ? "ring-2 ring-yellow-400 shadow-lg animate-pulse bg-yellow-500/10 rounded-lg p-2"
                : ""
            }`}
          >
            <div className="relative">
              <div
                className="
                max-h-120 overflow-y-auto pr-4
                scrollbar-thin
                scrollbar-thumb-slate-700/60
                scrollbar-track-transparent
                scrollbar-thumb-rounded-full
              "
              >
                <table className="w-full table-fixed">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-36">
                        Surface
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Material
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-choras-gray">
                      <td className="px-3 py-2 text-sm">
                        <button
                          onClick={() => setShowIndividualAssignments(!showIndividualAssignments)}
                          className="flex items-center gap-2 font-medium text-white hover:text-gray-300 transition-colors"
                        >
                          <span
                            className={`transform transition-transform ${showIndividualAssignments ? "rotate-90" : "rotate-0"}`}
                          >
                            <ChevronRight size={16} />
                          </span>
                          Assign all
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={getAssignAllValue()}
                          onValueChange={handleAssignAllMaterials}
                        >
                          <SelectTrigger
                            size="sm"
                            className="w-full bg-choras-dark border-choras-gray text-white [&>span]:truncate [&>span]:block [&>span]:max-w-full [&>svg]:text-choras-gray"
                          >
                            {isMaterialsMixed() ? (
                              <div className="flex items-center text-white">Mixed</div>
                            ) : (
                              <SelectValue placeholder="Select material for all surfaces" />
                            )}
                          </SelectTrigger>
                          <SelectContent className="bg-choras-dark border-choras-gray">
                            <SelectItem value="default" className="text-white">
                              None
                            </SelectItem>
                            <SelectItem value="mixed" className="text-gray-400" disabled hidden>
                              Mixed
                            </SelectItem>
                            {materialsLoading ? (
                              <SelectItem value="loading" disabled className="text-gray-400">
                                Loading materials...
                              </SelectItem>
                            ) : materialsError ? (
                              <SelectItem value="error" disabled className="text-red-400">
                                Error loading materials
                              </SelectItem>
                            ) : (
                              <TooltipProvider>
                                {materials.map((material) => (
                                  <Tooltip key={material.id} delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <SelectItem
                                        value={material.id.toString()}
                                        className="text-white"
                                      >
                                        <span className="truncate block" title={material.name}>
                                          {material.name}
                                        </span>
                                      </SelectItem>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="right"
                                      className="p-3 bg-choras-dark border-choras-primary"
                                    >
                                      <div className="text-sm mb-2 font-medium text-white">
                                        {material.name}
                                      </div>
                                      <AbsorptionCoefficientChart
                                        coefficients={material.absorptionCoefficients}
                                        size="md"
                                      />
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                <hr className="border-t border-gray-700 my-1" />
                                <SelectItem value="open-library" className="text-choras-primary">
                                  Open material library
                                </SelectItem>
                              </TooltipProvider>
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>

                    <TooltipProvider>
                      {showIndividualAssignments &&
                        surfaces.map((surface, index) => {
                          const surfaceKey = surface.id;
                          const assignedMaterialId = materialAssignments[surfaceKey];
                          const isSelected = selectedSurfaceId === surface.id;

                          return (
                            <tr
                              key={surface.id}
                              ref={isSelected ? selectedSurfaceRowRef : null}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                  handleSelectMultipleSurfaces(surface);
                                } else {
                                  handleSelectSurface(surface);
                                }
                              }}
                              className={`border-t border-gray-700 transition-colors duration-200 cursor-pointer ${
                                selectedGeometries[surface.mesh.uuid]
                                  ? "bg-choras-primary/20 hover:bg-choras-primary/30"
                                  : "hover:bg-choras-dark/90"
                              }`}
                            >
                              <td className="px-3 py-2 text-sm w-1/3">
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSurfaceVisibility(surfaceKey);
                                    }}
                                    className="cursor-pointer text-white hover:text-gray-300 transition-colors flex-shrink-0"
                                  >
                                    {hiddenSurfaces.has(surfaceKey) ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="font-medium truncate">
                                    {getDisplayName(surface, index)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 w-1/3" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={assignedMaterialId?.toString() || "default"}
                                  onValueChange={(value) =>
                                    handleMaterialAssignment(surfaceKey, value)
                                  }
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className="w-full bg-choras-dark border-choras-gray text-white [&>span]:truncate [&>span]:block [&>span]:max-w-full [&>svg]:text-choras-gray"
                                  >
                                    <SelectValue
                                      placeholder={getMaterialName(assignedMaterialId)}
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="bg-choras-dark border-choras-gray">
                                    <SelectItem value="default" className="text-white">
                                      None
                                    </SelectItem>
                                    {materialSelectOptions}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                    </TooltipProvider>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 bg-choras-dark border-t border-choras-gray pt-4 px-1">
        {surfaces.length > 0 && (
          <div className="border-choras-gray mb-4">
            <div className="text-sm text-gray-400 mb-1">
              Total: {surfaces.length} surfaces found
            </div>

            <div className="max-h-40">
              {Object.keys(selectedGeometries).length > 1 ? (
                <>
                  <div className="text-sm text-gray-400 mb-1">
                    Selected: {Object.keys(selectedGeometries).length}{" "}
                    {Object.keys(selectedGeometries).length === 1 ? "surface" : "surfaces"}
                  </div>

                  <table className="w-full table-fixed">
                    <tbody>
                      <tr className="cursor-pointer hover:bg-choras-dark/90">
                        <td className="py-2 text-sm w-1/3">
                          <div className="font-medium truncate">Assign to selected</div>
                        </td>

                        <td className="px-3 py-2 w-1/3" onClick={(e) => e.stopPropagation()}>
                          <Select value={bulkMaterialId} onValueChange={handleAssignBulkMaterials}>
                            <SelectTrigger
                              size="sm"
                              className="w-full bg-choras-dark border-choras-gray text-white"
                            >
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>

                            <SelectContent className="bg-choras-dark text-white border-choras-gray">
                              <SelectItem value="default">None</SelectItem>

                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id.toString()}>
                                  {material.name}
                                </SelectItem>
                              ))}

                              <hr className="border-t border-gray-700 my-1" />
                              <SelectItem value="open-library" className="text-choras-primary">
                                Open material library
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setOpenMaterialLibrary(true)}
          >
            Open material library
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleOpenCreateMaterialDialog}
          >
            <Plus size={14} />
            <span>Create material</span>
          </Button>
        </div>

        <FullSettingJsonEditor />

        <div className="mb-4" />
      </div>
    </div>
  );
}
