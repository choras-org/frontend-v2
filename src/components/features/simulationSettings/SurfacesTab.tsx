import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  assignMaterials,
  removeMaterialAssignment,
  removeMaterialAssignments,
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
import { ChevronDown, ChevronRight, Eye, EyeOff, Plus } from "lucide-react";
import { SurfaceMaterialList } from "./SurfaceMaterialList";
import { AbsorptionCoefficientChart } from "./AbsorptionCoefficientChart";
import { Button } from "@/components/ui/button";
import { FullSettingJsonEditor } from "./FullSettingJsonEditor";

/**
 * A material dropdown that only mounts the (relatively heavy) Radix `Select`
 * when the user interacts with it. Before that it renders a cheap button that
 * mimics the trigger. This keeps expanding a large surface list fast, since we
 * mount N lightweight buttons instead of N Radix Selects up front.
 */
function LazyMaterialSelect({
  value,
  label,
  onValueChange,
  children,
}: {
  value: string;
  label: React.ReactNode;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-choras-gray bg-choras-dark px-3 py-1 text-sm text-white"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-choras-gray" />
      </button>
    );
  }

  return (
    <Select
      defaultOpen
      value={value}
      onValueChange={onValueChange}
      onOpenChange={(isOpen) => {
        if (!isOpen) setOpen(false);
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-full bg-choras-dark border-choras-gray text-white [&>span]:truncate [&>span]:block [&>span]:max-w-full [&>svg]:text-choras-gray"
      >
        <span className="truncate">{label}</span>
      </SelectTrigger>
      <SelectContent className="bg-choras-dark border-choras-gray">{children}</SelectContent>
    </Select>
  );
}

export function SurfacesTab() {
  const dispatch = useDispatch();
  const surfaces = useSurfaces();
  const [showIndividualAssignments, setShowIndividualAssignments] = useState(false);
  const [hiddenSurfaces, setHiddenSurfaces] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    selectedGeometry,
    selectedGeometries,
    selectGeometry,
    addHighlightedMesh,
    addHighlightedMeshes,
    removeHighlightedMesh,
    removeHighlightedMeshes,
    addSelectedGeometry,
    addSelectedGeometries,
    removeSelectedGeometry,
    removeSelectedGeometries,
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

    const surface = surfaceById.get(surfaceKey);

    // If multiple surfaces selected and current surface is one of them, use bulk assign
    const isMultipleSelected =
      Object.keys(selectedGeometries).length > 1 &&
      surface?.mesh?.uuid &&
      selectedGeometries[surface.mesh.uuid];

    if (isMultipleSelected) {
      handleAssignBulkMaterials(materialId);
      return;
    }

    // Single surface assignment
    let updatedAssignments: Record<string, number>;

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
        const material = materialById.get(numMaterialId);
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
    const material = materialById.get(parseInt(materialId));

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
        newAssignments[surfaceKey] = numMaterialId;

        if (surface.mesh) {
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });
      dispatch(assignMaterials({ meshIds: surfaces.map((s) => s.id), materialId: numMaterialId }));
      updatedAssignments = { ...materialAssignments, ...newAssignments };
    }

    updateSimulationData(updatedAssignments);
  };

  const handleAssignGroupMaterials = async (groupSurfaces: SurfaceInfo[], materialId: string) => {
    if (materialId === "open-library") {
      setOpenMaterialLibrary(true);
      return;
    }

    const updatedAssignments: Record<string, number> = { ...materialAssignments };

    if (materialId === "default") {
      groupSurfaces.forEach((surface) => {
        delete updatedAssignments[surface.id];
        if (surface.mesh) {
          setMeshBaseColor(surface.mesh, 0xffffff);
        }
      });
      dispatch(removeMaterialAssignments(groupSurfaces.map((s) => s.id)));
    } else {
      const numMaterialId = parseInt(materialId);
      const material = materialById.get(numMaterialId);
      const avgAbsorption = material?.absorptionCoefficients
        ? calculateAverageAbsorption(material.absorptionCoefficients)
        : 0;
      const absorptionColor = getAbsorptionColor(avgAbsorption);

      groupSurfaces.forEach((surface) => {
        updatedAssignments[surface.id] = numMaterialId;
        if (surface.mesh) {
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });
      dispatch(
        assignMaterials({ meshIds: groupSurfaces.map((s) => s.id), materialId: numMaterialId }),
      );
    }

    updateSimulationData(updatedAssignments);
  };

  const getMaterialName = (materialId?: number) => {
    if (!materialId) return "Default";
    const material = materialById.get(materialId);
    return material?.name || "Unknown Material";
  };

  // Resolve the label shown on a (lazy) material dropdown for a given value.
  const materialLabelForValue = (value: string) => {
    if (value === "mixed") return "Mixed";
    if (value === "default") return "None";
    const id = parseInt(value);
    return Number.isNaN(id) ? "None" : getMaterialName(id);
  };

  const isMaterialsMixed = useMemo(() => {
    if (surfaces.length === 0) return false;
    const uniqueMaterials = new Set(surfaces.map((surface) => materialAssignments[surface.id]));
    return uniqueMaterials.size > 1;
  }, [surfaces, materialAssignments]);

  const getDisplayName = (surface: SurfaceInfo, index: number) => {
    if (surface.name && surface.name !== `Surface ${surface.meshId}`) {
      return surface.name;
    }
    return `Surface [${index + 1}]`;
  };

  const getAssignAllValue = useMemo(() => {
    if (surfaces.length === 0) return "default";

    if (isMaterialsMixed) {
      return "mixed";
    }

    const assignedMaterials = surfaces.map((surface) => materialAssignments[surface.id]);

    const firstMaterial = assignedMaterials[0];
    const allSame = assignedMaterials.every((materialId) => materialId === firstMaterial);

    if (allSame && firstMaterial !== undefined) {
      return firstMaterial.toString();
    }

    return "default";
  }, [surfaces, materialAssignments, isMaterialsMixed]);

  // Map each surface id to its global index so display names stay stable
  // regardless of how surfaces are grouped in the sidebar.
  const surfaceIndexById = useMemo(() => {
    const map = new Map<string, number>();
    surfaces.forEach((surface, index) => map.set(surface.id, index));
    return map;
  }, [surfaces]);

  // Group surfaces by their Rhino material name (from the original `usemtl`).
  const surfaceGroups = useMemo(() => {
    const groups = new Map<string, SurfaceInfo[]>();
    surfaces.forEach((surface) => {
      const groupName = surface.rhinoMaterialName || "Ungrouped";
      const existing = groups.get(groupName);
      if (existing) {
        existing.push(surface);
      } else {
        groups.set(groupName, [surface]);
      }
    });
    return Array.from(groups.entries())
      .map(([name, groupSurfaces]) => ({ name, surfaces: groupSurfaces }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [surfaces]);

  // O(1) lookup maps to avoid repeated linear scans over materials/surfaces.
  const materialById = useMemo(() => {
    const map = new Map<number, (typeof materials)[number]>();
    materials.forEach((material) => map.set(material.id, material));
    return map;
  }, [materials]);

  const surfaceById = useMemo(() => {
    const map = new Map<string, SurfaceInfo>();
    surfaces.forEach((surface) => map.set(surface.id, surface));
    return map;
  }, [surfaces]);

  const surfaceByUuid = useMemo(() => {
    const map = new Map<string, SurfaceInfo>();
    surfaces.forEach((surface) => map.set(surface.mesh.uuid, surface));
    return map;
  }, [surfaces]);

  type SurfaceGroup = { name: string; surfaces: SurfaceInfo[] };
  type FlatRow =
    | { kind: "assign-all"; key: string }
    | { kind: "group"; key: string; group: SurfaceGroup }
    | { kind: "surface"; key: string; group: SurfaceGroup; surface: SurfaceInfo; index: number };

  // Flatten the visible tree (assign-all row + group headers + expanded surface
  // rows) into a single list so it can be virtualized. Only rows for expanded
  // groups are included here; highlighting in the 3D viewport is handled
  // separately in `toggleGroup` and covers every surface regardless of what is
  // rendered.
  const flatRows = useMemo(() => {
    const rows: FlatRow[] = [{ kind: "assign-all", key: "__assign_all__" }];
    if (showIndividualAssignments) {
      surfaceGroups.forEach((group) => {
        rows.push({ kind: "group", key: `group:${group.name}`, group });
        if (expandedGroups.has(group.name)) {
          group.surfaces.forEach((surface) => {
            rows.push({
              kind: "surface",
              key: `surface:${surface.id}`,
              group,
              surface,
              index: surfaceIndexById.get(surface.id) ?? 0,
            });
          });
        }
      });
    }
    return rows;
  }, [surfaceGroups, expandedGroups, showIndividualAssignments, surfaceIndexById]);

  // Estimated starting height per row; the real height of each rendered row is
  // measured dynamically via `measureElement`, so rows may be taller (e.g. when
  // content wraps) without clipping or overlapping.
  const ROW_HEIGHT = 48;
  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 0,
    getItemKey: (index) => flatRows[index].key,
  });

  const highlightGroupSurfaces = (groupSurfaces: SurfaceInfo[]) => {
    // Mutate mesh colors directly (cheap, non-Redux) per surface, but batch the
    // Redux selection/highlight updates into a single dispatch each so opening a
    // large group does not fire thousands of store updates.
    groupSurfaces.forEach((surface) => {
      highlightMesh(surface.mesh, HIGHLIGHT_COLOR);
    });
    addHighlightedMeshes(groupSurfaces.map((surface) => surface.mesh));
    addSelectedGeometries(
      groupSurfaces.map((surface) => ({
        mesh: surface.mesh,
        faceIndex: 0,
        point: new THREE.Vector3(),
        materialId: surface.id,
      })),
    );
  };

  const unhighlightGroupSurfaces = (groupSurfaces: SurfaceInfo[]) => {
    groupSurfaces.forEach((surface) => {
      restoreOriginalColor(surface.mesh);
    });
    const uuids = groupSurfaces.map((surface) => surface.mesh.uuid);
    removeHighlightedMeshes(uuids);
    removeSelectedGeometries(uuids);
  };

  const toggleGroup = (group: { name: string; surfaces: SurfaceInfo[] }) => {
    const isExpanded = expandedGroups.has(group.name);

    if (isExpanded) {
      // Collapsing: remove the group's highlight/selection. If the currently
      // focused surface belongs to this group, deselect it first so the
      // auto-expand effect does not immediately re-open the group.
      unhighlightGroupSurfaces(group.surfaces);
      if (
        selectedGeometry?.mesh &&
        group.surfaces.some((surface) => surface.mesh.uuid === selectedGeometry.mesh.uuid)
      ) {
        selectGeometry(null);
      }
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.delete(group.name);
        return next;
      });
    } else {
      // Expanding: highlight every surface in the group in the viewport.
      highlightGroupSurfaces(group.surfaces);
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.add(group.name);
        return next;
      });
    }
  };

  const isGroupMaterialsMixed = (groupSurfaces: SurfaceInfo[]) => {
    if (groupSurfaces.length === 0) return false;
    const unique = new Set(groupSurfaces.map((surface) => materialAssignments[surface.id]));
    return unique.size > 1;
  };

  const getGroupAssignValue = (groupSurfaces: SurfaceInfo[]) => {
    if (groupSurfaces.length === 0) return "default";
    if (isGroupMaterialsMixed(groupSurfaces)) return "mixed";
    const first = materialAssignments[groupSurfaces[0].id];
    return first !== undefined ? first.toString() : "default";
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

  const selectedSurfaceId = useMemo(() => {
    if (!selectedGeometry?.mesh) return null;
    const matched = surfaceByUuid.get(selectedGeometry.mesh.uuid);
    return matched?.id ?? null;
  }, [selectedGeometry, surfaceByUuid]);

  useEffect(() => {
    if (!selectedSurfaceId) return;

    if (!showIndividualAssignments) {
      setShowIndividualAssignments(true);
    }

    // Ensure the group containing the selected surface is expanded so its row
    // exists in the flattened list and can be scrolled into view.
    const selectedSurface = surfaces.find((surface) => surface.id === selectedSurfaceId);
    const groupName = selectedSurface?.rhinoMaterialName || "Ungrouped";
    setExpandedGroups((prev) => (prev.has(groupName) ? prev : new Set(prev).add(groupName)));
  }, [selectedSurfaceId, showIndividualAssignments, surfaces]);

  // Scroll the selected surface into view once it is present in the flattened,
  // virtualized list.
  useEffect(() => {
    if (!selectedSurfaceId) return;

    const flatIndex = flatRows.findIndex(
      (row) => row.kind === "surface" && row.surface.id === selectedSurfaceId,
    );
    if (flatIndex < 0) return;

    const timer = setTimeout(() => {
      rowVirtualizer.scrollToIndex(flatIndex, { align: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedSurfaceId, flatRows, rowVirtualizer]);

  const handleSelectSurface = useCallback(
    (surface: SurfaceInfo) => {
      // Restore/deselect every currently highlighted geometry (e.g. all
      // surfaces of an expanded group) so a plain click keeps only the clicked
      // surface highlighted and clears the rest. Restoring mesh colors is a
      // cheap direct mutation; the Redux highlight removal is batched into a
      // single dispatch to avoid a store update per surface.
      const uuidsToClear = new Set(Object.keys(selectedGeometries));
      Object.values(selectedGeometries).forEach((geo) => restoreOriginalColor(geo.mesh));
      if (selectedGeometry?.mesh) {
        uuidsToClear.add(selectedGeometry.mesh.uuid);
        restoreOriginalColor(selectedGeometry.mesh);
      }
      removeHighlightedMeshes(Array.from(uuidsToClear));

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
      selectedGeometries,
      selectedGeometry,
      selectGeometry,
      highlightMesh,
      HIGHLIGHT_COLOR,
      addHighlightedMesh,
      removeHighlightedMeshes,
      restoreOriginalColor,
      clearSelectedGeometries,
      addSelectedGeometry,
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
    const material = materialById.get(parseInt(materialId));

    if (materialId === "default") {
      const numMaterialId = parseInt(materialId);
      const newAssignments: Record<string, number> = {};
      const assignedIds: string[] = [];

      surfaces.forEach((surface) => {
        if (selectedGeometries[surface.mesh.uuid]) {
          const surfaceKey = surface.id;
          assignedIds.push(surfaceKey);
          newAssignments[surfaceKey] = numMaterialId;
          setMeshBaseColor(surface.mesh, 0xffffff);
        }
      });
      dispatch(assignMaterials({ meshIds: assignedIds, materialId: numMaterialId }));

      updatedAssignments = { ...materialAssignments, ...newAssignments };
    } else {
      const newAssignments: Record<string, number> = {};
      const numMaterialId = parseInt(materialId);
      const avgAbsorption = material?.absorptionCoefficients
        ? calculateAverageAbsorption(material.absorptionCoefficients)
        : 0;
      const absorptionColor = getAbsorptionColor(avgAbsorption);

      const assignedIds: string[] = [];
      surfaces.forEach((surface) => {
        if (selectedGeometries[surface.mesh.uuid]) {
          const surfaceKey = surface.id;
          assignedIds.push(surfaceKey);
          newAssignments[surfaceKey] = numMaterialId;
          setMeshBaseColor(surface.mesh, absorptionColor);
        }
      });
      dispatch(assignMaterials({ meshIds: assignedIds, materialId: numMaterialId }));

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
              {/* Fixed column header (kept outside the scroll area so the
                  virtualized body can start at scroll offset 0). */}
              <div className="flex items-center border-b border-choras-gray pr-4">
                <div className="w-36 px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Surface
                </div>
                <div className="flex-1 px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Material
                </div>
              </div>

              {/* Virtualized, scrollable body. Only rows within the viewport are
                  mounted; group highlighting in the 3D viewport still covers
                  every surface in the group (see toggleGroup). */}
              <div
                ref={scrollContainerRef}
                className="
                max-h-120 overflow-y-auto pr-4
                scrollbar-thin
                scrollbar-thumb-slate-700/60
                scrollbar-track-transparent
                scrollbar-thumb-rounded-full
              "
              >
                <TooltipProvider>
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = flatRows[virtualRow.index];
                      const rowStyle = {
                        position: "absolute" as const,
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      };

                      if (row.kind === "assign-all") {
                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={rowStyle}
                            className="flex items-center border-b border-choras-gray"
                          >
                            <div className="w-36 px-3 py-2 text-sm">
                              <button
                                onClick={() =>
                                  setShowIndividualAssignments(!showIndividualAssignments)
                                }
                                className="flex items-center gap-2 font-medium text-white hover:text-gray-300 transition-colors"
                              >
                                <span
                                  className={`transform transition-transform ${showIndividualAssignments ? "rotate-90" : "rotate-0"}`}
                                >
                                  <ChevronRight size={16} />
                                </span>
                                Assign all
                              </button>
                            </div>
                            <div
                              className="flex-1 min-w-0 px-3 py-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Select
                                value={getAssignAllValue}
                                onValueChange={handleAssignAllMaterials}
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="w-full bg-choras-dark border-choras-gray text-white [&>span]:truncate [&>span]:block [&>span]:max-w-full [&>svg]:text-choras-gray"
                                >
                                  {isMaterialsMixed ? (
                                    <div className="flex items-center text-white">Mixed</div>
                                  ) : (
                                    <SelectValue placeholder="Select material for all surfaces" />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-choras-dark border-choras-gray">
                                  <SelectItem value="default" className="text-white">
                                    None
                                  </SelectItem>
                                  <SelectItem
                                    value="mixed"
                                    className="text-gray-400"
                                    disabled
                                    hidden
                                  >
                                    Mixed
                                  </SelectItem>
                                  {materialSelectOptions}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      }

                      if (row.kind === "group") {
                        const group = row.group;
                        const isGroupExpanded = expandedGroups.has(group.name);
                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={rowStyle}
                            className="flex items-center border-t border-gray-700 bg-choras-dark/40"
                          >
                            <div className="w-36 min-w-0 px-3 py-2 text-sm">
                              <button
                                onClick={() => toggleGroup(group)}
                                className="flex items-center gap-2 font-medium text-white hover:text-gray-300 transition-colors w-full text-left"
                              >
                                <span
                                  className={`transform transition-transform flex-shrink-0 ${isGroupExpanded ? "rotate-90" : "rotate-0"}`}
                                >
                                  <ChevronRight size={16} />
                                </span>
                                <span className="truncate" title={group.name}>
                                  {group.name}
                                </span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  ({group.surfaces.length})
                                </span>
                              </button>
                            </div>
                            <div
                              className="flex-1 min-w-0 px-3 py-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Select
                                value={getGroupAssignValue(group.surfaces)}
                                onValueChange={(value) =>
                                  handleAssignGroupMaterials(group.surfaces, value)
                                }
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="w-full bg-choras-dark border-choras-gray text-white [&>span]:truncate [&>span]:block [&>span]:max-w-full [&>svg]:text-choras-gray"
                                >
                                  {isGroupMaterialsMixed(group.surfaces) ? (
                                    <div className="flex items-center text-white">Mixed</div>
                                  ) : (
                                    <SelectValue placeholder="Select material for group" />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-choras-dark border-choras-gray">
                                  <SelectItem value="default" className="text-white">
                                    None
                                  </SelectItem>
                                  <SelectItem
                                    value="mixed"
                                    className="text-gray-400"
                                    disabled
                                    hidden
                                  >
                                    Mixed
                                  </SelectItem>
                                  {materialSelectOptions}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      }

                      // row.kind === "surface"
                      const surface = row.surface;
                      const surfaceKey = surface.id;
                      const assignedMaterialId = materialAssignments[surfaceKey];
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          style={rowStyle}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              handleSelectMultipleSurfaces(surface);
                            } else {
                              handleSelectSurface(surface);
                            }
                          }}
                          className={`flex items-center border-t border-gray-700 transition-colors duration-200 cursor-pointer ${
                            selectedGeometries[surface.mesh.uuid]
                              ? "bg-choras-primary/20 hover:bg-choras-primary/30"
                              : "hover:bg-choras-dark/90"
                          }`}
                        >
                          <div className="w-36 min-w-0 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 pl-6">
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
                                {getDisplayName(surface, row.index)}
                              </div>
                            </div>
                          </div>
                          <div
                            className="flex-1 min-w-0 px-3 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LazyMaterialSelect
                              value={assignedMaterialId?.toString() || "default"}
                              label={materialLabelForValue(
                                assignedMaterialId?.toString() || "default",
                              )}
                              onValueChange={(value) => handleMaterialAssignment(surfaceKey, value)}
                            >
                              <SelectItem value="default" className="text-white">
                                None
                              </SelectItem>
                              {materialSelectOptions}
                            </LazyMaterialSelect>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
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
