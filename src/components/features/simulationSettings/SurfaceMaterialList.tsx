import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, SquarePen, Copy } from "lucide-react";
import { useState } from "react";
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
  const [selectedMaterialForEdit, setSelectedMaterialForEdit] = useState<Material | null>(null);
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [isOpenEditForm, setIsOpenEditForm] = useState(false);
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const [isOpenCopyForm, setIsOpenCopyForm] = useState(false);
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);
  const [updateSimulation] = useUpdateSimulationMutation();

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (material: Omit<Material, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createMaterial(material).unwrap();
      toast.success("Material created successfully!");
      setOpenCreateMaterialDialog(false);
    } catch (error) {
      toast.error("Failed to create material");
      console.error("Error creating material:", error);
    }
  };

  const handleUpdate = async (material: Omit<Material, "createdAt" | "updatedAt" | "id">) => {
    try {
      await updateMaterial({ id: selectedMaterialForEdit?.id as number, ...material }).unwrap();
      toast.success("Material updated successfully!");
      setIsOpenEditForm(false);
    } catch (error) {
      toast.error("Failed to update material");
      console.error("Error updating material:", error);
    }
  };

  const handleCopy = async (material: Omit<Material, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newMaterial = await createMaterial(material).unwrap();

      const layerIdByMaterialId: Record<string, number> = {};
      for (const key in activeSimulation?.layerIdByMaterialId) {
        if (activeSimulation?.layerIdByMaterialId[key] === selectedMaterialForEdit?.id) {
          layerIdByMaterialId[key] = newMaterial.id;
        } else {
          layerIdByMaterialId[key] = activeSimulation?.layerIdByMaterialId[key];
        }
      }

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

      toast.success("Material copied successfully!");
      setIsOpenCopyForm(false);
    } catch (error) {
      toast.error("Failed to copy material");
      console.error("Error copying material:", error);
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
                title="Create material"
                isOpen={openCreateMaterialDialog}
                onOpen={setOpenCreateMaterialDialog}
                label={"Create material"}
                description={"Fill in the details to create a new material."}
                onSubmit={handleCreate}
                isLoading={isCreating}
              />

              <MaterialFormDialog
                isOpen={isOpenEditForm}
                onOpen={() => setIsOpenEditForm(!isOpenEditForm)}
                material={selectedMaterialForEdit}
                title="Update material"
                label="Update material"
                description={"Update the details of the material."}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
                isShownTrigger={false}
              />

              <MaterialFormDialog
                isOpen={isOpenCopyForm}
                onOpen={() => setIsOpenCopyForm(!isOpenCopyForm)}
                material={selectedMaterialForEdit}
                title="Copy material"
                label="Copy material"
                description={"Copy the details of the material to create a new one."}
                onSubmit={handleCopy}
                isLoading={isUpdating}
                isShownTrigger={false}
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
                          {material.origin === "user" ? (
                            <SquarePen
                              size={16}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterialForEdit(material);
                                setIsOpenEditForm(true);
                              }}
                            />
                          ) : (
                            <Copy
                              size={16}
                              onClick={(e) => {
                                e.stopPropagation();
                                const payload = {
                                  ...material,
                                  name: "Copy of " + material.name,
                                };
                                setSelectedMaterialForEdit(payload);
                                setIsOpenCopyForm(true);
                              }}
                            />
                          )}
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
