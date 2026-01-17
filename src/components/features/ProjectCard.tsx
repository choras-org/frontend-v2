import type { Project } from "@/types/project";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import modelImg from "@/assets/model.png";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { simulationApi } from "@/store/simulationApi";
import type { AppDispatch } from "@/store";
import { selectSimulationCountByProjectId } from "@/store/simulationSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "lucide-react";
import { useDeleteProjectMutation } from "@/store/projectApi";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { ProjectForm } from "./ProjectForm";
import { formatDateLong } from "@/helpers/datetime";
import { sortModels } from "@/pages/ProjectDetailPage";
import type { Model } from "@/types/model";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard(props: ProjectCardProps) {
  const { project } = props;
  const dispatch: AppDispatch = useDispatch();
  const [deleteProject] = useDeleteProjectMutation();
  const simulationCount = useSelector(selectSimulationCountByProjectId(project.id));
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    if (project.models.length > 0) {
      // Fetch simulations for the first model as an example
      project.models.forEach((model) => {
        dispatch(simulationApi.endpoints.getSimulationsByModelId.initiate(model.id));
      });
    }
  }, [project, dispatch]);

  useEffect(() => {
    if (project?.models) {
      const savedSortOption = localStorage.getItem("modelSortOption");
      const sortedModels = sortModels(project.models, savedSortOption || "ASC");
      setModels(sortedModels);
    }
  }, [project]);

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id.toString()).unwrap();

      toast.success("Project deleted successfully");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <Card className="min-h-[192px] border border-transparent bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-border p-0.5 card-container">
      <div className="bg-[#e7e7e7] min-h-[190px] py-6 rounded-lg h-full flex flex-col justify-between">
        <CardHeader className="overflow-hidden relative px-5">
          <CardTitle className="truncate font-inter font-bold text-sm text-choras-secondary">
            {project.name}
          </CardTitle>

          {/* stopPropagation on dropdown open, to avoid event bubbling which cause navigation to detail project */}
          <CardAction onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer absolute right-0 px-4">
                <EllipsisVerticalIcon className="text-black/50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <ProjectForm
                  defaultValues={project}
                  id={project.id}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit project
                    </DropdownMenuItem>
                  }
                />
                <ProjectForm
                  defaultValues={project}
                  id={project.id}
                  groupOnly
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Change group
                    </DropdownMenuItem>
                  }
                />
                <ConfirmDialog
                  title="Delete Project"
                  description="Are you sure you want to delete this project? This action cannot be undone."
                  onConfirm={handleDeleteProject}
                  confirmVariant="destructive"
                  confirmLabel="Delete Project"
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600"
                    >
                      Delete project
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col card-responsive-horizontal gap-4 pt-4">
          <div className="text-black/50 text-xs space-y-1 card-responsive-order-1">
            <p>{models.length} model</p>
            <p>{simulationCount} simulations</p>
            <p>Created: {formatDateLong(project.createdAt)}</p>
            <p>Updated: {formatDateLong(project.updatedAt)}</p>
          </div>

          <div className="card-responsive-visible relative max-w-36 w-full aspect-[3/2] card-responsive-order-2 card-responsive-scale">
            {/* Stack of cards based on model length */}
            {models &&
              models.length > 0 &&
              models
                .slice(0, 3)
                .reverse()
                .map((model, index) => (
                  <img
                    key={model.id}
                    className="absolute w-32 h-24 rounded-lg bg-white/80"
                    src={model.imagePath ? `${API_URL}/${model.imagePath}` : modelImg}
                    alt="Model Illustration"
                    style={{
                      transform: `rotate(${index * 15 - 5}deg) translate(${index * (models.length > 2 ? 15 : 30) - 30}px, ${index * -2}px)`,
                      boxShadow: `0 ${2 + index * 2}px ${4 + index * 2}px rgba(0, 0, 0, 0.2), 0 ${1 + index}px ${2 + index}px rgba(0, 0, 0, 0.1)`,
                    }}
                  />
                ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
