import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import type { Material } from "@/types/material";
import { CreateMaterialDialog } from "./CreateMaterialDialog";

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

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
              <CreateMaterialDialog
                openCreateMaterialDialog={openCreateMaterialDialog}
                setOpenCreateMaterialDialog={setOpenCreateMaterialDialog}
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
                            <h4 className="font-medium text-sm break-words">{material.name}</h4>
                            {material.description && (
                              <p className="text-xs text-gray-500 break-words">
                                {material.description}
                              </p>
                            )}
                          </div>
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
