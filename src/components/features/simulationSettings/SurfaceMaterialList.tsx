import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Search, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCreateMaterialMutation,
  useGetMaterialsQuery,
  useUpdateMaterialMutation,
} from "@/store/materialsApi";
import type { Material } from "@/types/material";
import { MaterialFormDialog } from "./MaterialFormDialog";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useUpdateSimulationMutation } from "@/store/simulationApi";

type IProps = {
  openMaterialLibrary: boolean;
  setOpenMaterialLibrary: (open: boolean) => void;
  openCreateMaterialDialog: boolean;
  setOpenCreateMaterialDialog: (open: boolean) => void;
};

export function SurfaceMaterialList({
  openMaterialLibrary,
  setOpenMaterialLibrary,
  openCreateMaterialDialog,
  setOpenCreateMaterialDialog,
}: IProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: materials = [], isLoading, error } = useGetMaterialsQuery();
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const [updateSimulation] = useUpdateSimulationMutation();

  const [openMaterialForm, setOpenMaterialForm] = useState(false);
  const [materialActionType, setMaterialActionType] = useState<
    "Create" | "Edit" | "Copy" | "Duplicate"
  >("Create");
  const [material, setMaterial] = useState<Material | null>(null);

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (openCreateMaterialDialog) {
      setSelectedMaterial(null);
      setSearchQuery("");
      setMaterialActionType("Create");
      setMaterial(null);
      setOpenMaterialForm(true);
    }
  }, [openCreateMaterialDialog]);

  const handleCreate = async (material: Omit<Material, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createMaterial(material).unwrap();
      toast.success("Material created successfully!");
      setOpenMaterialForm(false);
      setOpenCreateMaterialDialog(false);
    } catch (error) {
      toast.error("Failed to create material");
      console.error("Error creating material:", error);
    }
  };

  const handleUpdate = async (payload: Omit<Material, "createdAt" | "updatedAt" | "id">) => {
    try {
      await updateMaterial({ id: material?.id as number, ...payload }).unwrap();
      toast.success("Material edited successfully!");
      setOpenMaterialForm(false);
    } catch (error) {
      toast.error("Failed to edit material");
      console.error("Error editing material:", error);
    }
  };

  const handleCopy = async (payload: Omit<Material, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newMaterial = await createMaterial(payload).unwrap();

      const layerIdByMaterialId: Record<string, number> = {
        ...activeSimulation?.layerIdByMaterialId,
      };
      for (const key in activeSimulation?.layerIdByMaterialId) {
        if (activeSimulation?.layerIdByMaterialId[key] === material?.id) {
          layerIdByMaterialId[key] = newMaterial.id;
        }
      }

      if (Object.keys(layerIdByMaterialId).length > 0) {
        const payload = {
          id: activeSimulation?.id as number,
          body: {
            modelId: activeSimulation?.modelId as number,
            name: activeSimulation?.name,
            status: activeSimulation?.status,
            hasBeenEdited: true,
            layerIdByMaterialId: layerIdByMaterialId,
          },
        };
        await updateSimulation(payload).unwrap();
      }

      toast.success("Material edited successfully!");
      setOpenMaterialForm(false);
    } catch (error) {
      toast.error("Failed to edit material");
      console.error("Error editing material:", error);
    }
  };

  const handleMaterialAction = (
    e: React.MouseEvent,
    material: Material,
    actionType: "Create" | "Edit" | "Copy" | "Duplicate",
  ) => {
    e.stopPropagation();

    const materialCopy = { ...material };
    if ((actionType === "Edit" && material.origin === "factory") || actionType === "Duplicate") {
      materialCopy.name = "Copy of " + material.name;
    }

    setMaterial(materialCopy);
    setMaterialActionType(actionType);
    setOpenMaterialForm(true);
  };

  const handleSubmit = async (payload: Omit<Material, "id" | "createdAt" | "updatedAt">) => {
    if (materialActionType === "Create") {
      await handleCreate(payload);
    } else if (materialActionType === "Edit") {
      if (material?.origin === "factory") {
        await handleCopy(payload);
      } else {
        await handleUpdate(payload);
      }
    } else if (materialActionType === "Duplicate") {
      await handleCreate(payload);
    }
  };

  return (
    <Dialog open={openMaterialLibrary} onOpenChange={setOpenMaterialLibrary}>
      {/* <Button variant="ghost" className="rounded-full hover:bg-gray-600 hover:text-white">
        <EllipsisVertical size={20} className="text-white" />
      </Button> */}
      <DialogContent className="sm:max-w-3xl max-w-lg border border-transparent bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-border p-0.5">
        <div className="bg-white p-6 rounded-lg space-y-6">
          <DialogHeader>
            <div className="flex justify-between items-center mt-4">
              <DialogTitle className="text-xl text-choras-primary">Material library</DialogTitle>

              <MaterialFormDialog
                title={`${openCreateMaterialDialog ? "Create" : materialActionType} material`}
                material={materialActionType === "Create" ? null : material}
                isOpen={openMaterialForm}
                onOpen={(open) => {
                  setMaterialActionType("Create");
                  setMaterial(null);
                  setOpenMaterialForm(open);
                  setOpenCreateMaterialDialog(open);
                }}
                label={`${openCreateMaterialDialog ? "Create" : materialActionType} material`}
                description={`${openCreateMaterialDialog ? "Create" : materialActionType} a surface material to use in your simulations.`}
                onSubmit={openCreateMaterialDialog ? handleCreate : handleSubmit}
                isLoading={isUpdating || isCreating}
                notes={
                  materialActionType === "Edit" && material?.origin === "factory"
                    ? "The material you tried to edit is a factory material. The original material will not be overwritten, but all surfaces with this factory material assigned will now have the edited material assigned to them."
                    : undefined
                }
                notesColor={
                  materialActionType === "Edit" && material?.origin === "factory"
                    ? "red"
                    : undefined
                }
                isShownTrigger={true}
              />
            </div>
            <DialogDescription>Select a material to view its details</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4 my-6 max-h-96 overflow-y-auto">
            {isLoading && <div className="text-center">Loading materials...</div>}
            {error && <div className="text-center text-red-500">Error loading materials</div>}
            {filteredMaterials.length > 0 && (
              <>
                {Object.entries(
                  filteredMaterials.reduce(
                    (acc, material) => {
                      if (!acc[material.category]) {
                        acc[material.category] = [];
                      }
                      acc[material.category].push(material);
                      return acc;
                    },
                    {} as Record<string, Material[]>,
                  ),
                ).map(([category, categoryMaterials]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wide break-words">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryMaterials.map((material) => (
                        <div
                          key={material.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedMaterial?.id === material.id
                              ? "border-choras-primary bg-choras-gray/5"
                              : "border-choras-gray"
                          }`}
                          onClick={() => setSelectedMaterial(material)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h4 className="font-medium text-sm break-words">{material.name}</h4>
                              <label className="text-[10px] text-gray-500 border border-gray-300 px-2 ml-1 rounded-full">
                                {material.origin}
                              </label>
                            </div>
                            {material.description && (
                              <p className="text-xs text-gray-500 break-words">
                                {material.description}
                              </p>
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SquarePen
                                size={16}
                                className="cursor-pointer hover:text-choras-primary transition-colors"
                                onClick={(e) => handleMaterialAction(e, material, "Edit")}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit material</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Copy
                                size={16}
                                className="cursor-pointer hover:text-choras-primary transition-colors"
                                onClick={(e) => handleMaterialAction(e, material, "Duplicate")}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplicate material</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
            {!isLoading && !error && filteredMaterials.length === 0 && materials.length > 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No materials found matching "{searchQuery}"
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="w-full">
              {selectedMaterial && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg w-full">
                    <h4 className="font-medium text-sm mb-3">{selectedMaterial.name}</h4>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-1 px-1 font-medium text-gray-700">Freq</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">63</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">125</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">250</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">500</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">1k</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">2k</th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700">4k</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left py-1 px-1 font-medium text-gray-700">Abs</td>
                            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                              <td key={index} className="text-center py-1 px-1 text-gray-600">
                                {selectedMaterial.absorptionCoefficients[index] ?? "-"}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
