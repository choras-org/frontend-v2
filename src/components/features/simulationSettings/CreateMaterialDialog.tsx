import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useCreateMaterialMutation } from "@/store/materialsApi";
import { toast } from "sonner";

type IProps = {
  openCreateMaterialDialog: boolean;
  setOpenCreateMaterialDialog: (open: boolean) => void;
};

export function CreateMaterialDialog({
  openCreateMaterialDialog,
  setOpenCreateMaterialDialog,
}: IProps) {
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    absorptionCoefficients: [0.01, 0.04, 0.14, 0.47, 0.88, 0.53, 0.26],
  });

  const handleInputChange = (field: string, value: string | number[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoeffChange = (index: number, value: string) => {
    const newCoeffs = [...formData.absorptionCoefficients];
    newCoeffs[index] = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, absorptionCoefficients: newCoeffs }));
  };

  const frequencyLabels = ["63Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz"];

  const handleSliderClick = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    const percentage = 1 - y / height; // Invert because top = high value
    const newValue = Math.max(0, Math.min(1, percentage));
    const roundedValue = Math.round(newValue * 100) / 100;
    handleCoeffChange(index, roundedValue.toString());
  };

  const handleCreateSubmit = async () => {
    try {
      await createMaterial(formData).unwrap();
      toast.success("Material created successfully!");
      setOpenCreateMaterialDialog(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        absorptionCoefficients: [0.01, 0.04, 0.14, 0.47, 0.88, 0.53, 0.26],
      });
    } catch (error) {
      toast.error("Failed to create material");
      console.error("Error creating material:", error);
    }
  };

  return (
    <Dialog open={openCreateMaterialDialog} onOpenChange={setOpenCreateMaterialDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus size={16} />
          Create material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Material</DialogTitle>
          <DialogDescription>Add a new material with acoustic properties</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="col-span-3"
              placeholder="Material name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="col-span-3"
              placeholder="Material category"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right mt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="col-span-3"
              placeholder="Material description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="mt-2">Absorption Coefficients</Label>
            <div className="col-span-3">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-center items-end gap-3 h-44">
                  {formData.absorptionCoefficients.map((coeff, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={coeff}
                        onChange={(e) => handleCoeffChange(index, e.target.value)}
                        className="w-12 h-6 text-center text-xs px-1 py-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />

                      <div className="relative h-32 w-8 flex justify-center">
                        <div
                          className="relative h-32 w-3 bg-choras-gray rounded cursor-pointer border border-gray-300"
                          onClick={(e) => handleSliderClick(index, e)}
                        >
                          <div
                            className="absolute w-5 h-4 bg-white border-2 border-gray-700 rounded-sm cursor-grab shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: "50%",
                              top: `${(1 - coeff) * 100}%`,
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const startY = e.clientY;
                              const startValue = coeff;
                              const slider = e.currentTarget.parentElement!;
                              const sliderRect = slider.getBoundingClientRect();

                              const handleMouseMove = (e: MouseEvent) => {
                                const deltaY = e.clientY - startY;
                                const deltaPercentage = deltaY / sliderRect.height;
                                const newValue = Math.max(
                                  0,
                                  Math.min(1, startValue - deltaPercentage),
                                );
                                const roundedValue = Math.round(newValue * 100) / 100; // Round to 2 decimal places
                                handleCoeffChange(index, roundedValue.toString());
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
                              };

                              document.addEventListener("mousemove", handleMouseMove);
                              document.addEventListener("mouseup", handleMouseUp);
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-xs font-medium text-gray-600 text-center">
                        {frequencyLabels[index]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Drag sliders to adjust absorption coefficients (0.00 - 1.00)
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateSubmit}
            disabled={isCreating || !formData.name || !formData.category}
          >
            {isCreating ? "Creating..." : "Create Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
