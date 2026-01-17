import type { Model } from "@/types/model";
import { EllipsisVerticalIcon } from "lucide-react";
import { simulationApi, useGetSimulationsByModelIdQuery } from "@/store/simulationApi";
import { useDeleteModelMutation } from "@/store/modelApi";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { projectApi, useGetProjectQuery } from "@/store/projectApi";
import { toast } from "sonner";
import modelImg from "@/assets/model.png";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateLong } from "@/helpers/datetime";
import { UpdateModel } from "./UpdateModel";

type ModelCardProps = {
  model: Model;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function ModelCard({ model }: ModelCardProps) {
  const dispatch: AppDispatch = useDispatch();
  const { data: simulations } = useGetSimulationsByModelIdQuery(model.id);
  const [deleteModel] = useDeleteModelMutation();
  const { refetch } = useGetProjectQuery(model.projectId.toString());

  const handleDeleteModel: () => Promise<void> = async () => {
    try {
      await deleteModel(model.id).unwrap();
      dispatch(projectApi.util.invalidateTags([{ type: "Projects" }]));
      dispatch(simulationApi.util.invalidateTags([{ type: "SimulationsByModel" }]));
      toast.success("Model deleted successfully");
    } catch {
      toast.error("Failed to delete model");
    }
  };

  return (
    <Card className="min-h-[192px] border border-transparent bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-border p-0.5 card-container">
      <div className="bg-[#e7e7e7] min-h-[190px] py-6 rounded-lg h-full flex flex-col justify-between">
        <CardHeader className="overflow-hidden relative px-5">
          <CardTitle className="truncate font-inter font-bold text-sm text-choras-secondary">
            {model.name}
          </CardTitle>
          <CardAction onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer absolute right-0 px-4">
                <EllipsisVerticalIcon className="text-black/50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <UpdateModel
                  modelName={model.name}
                  modelId={model.id.toString()}
                  onSuccess={() => refetch()}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit name
                    </DropdownMenuItem>
                  }
                />
                <ConfirmDialog
                  onConfirm={handleDeleteModel}
                  title="Delete model"
                  description="This action cannot be undone."
                  confirmLabel="Delete model"
                  confirmVariant="destructive"
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600"
                    >
                      Delete model
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col card-responsive-horizontal gap-4 pt-4">
          <div className="card-responsive-visible relative max-w-36 w-full aspect-[3/2] card-responsive-order-2 card-responsive-scale">
            <img
              className="absolute w-full h-full max-w-36 max-h-24 object-contain rounded-lg bg-white/80"
              src={model.imagePath ? `${API_URL}/${model.imagePath}` : modelImg}
              alt="Model Illustration"
            />
          </div>
          <div className="text-black/50 text-xs space-y-1 card-responsive-order-1">
            <p>{simulations?.length || 0} simulations</p>
            <p>Created: {formatDateLong(model.createdAt)}</p>
            <p>Updated: {formatDateLong(model.updatedAt)}</p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
