import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetProjectsSimulationsQuery } from "@/store/projectApi";

interface ChooseModelProps {
  onModelSelect: (modelId: number) => void;
  trigger: React.ReactElement;
}

export function ChooseModel({ onModelSelect, trigger }: ChooseModelProps) {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const { data: projectsSimulations = [] } = useGetProjectsSimulationsQuery();

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedGroup("");
      setSelectedProjectId("");
      setSelectedModelId("");
    }
    setOpen(open);
  };

  // Get unique groups that have projects with simulations
  const allGroupsWithProjects = Array.from(
    new Set(
      projectsSimulations
        .filter((ps) => ps.simulations.length > 0)
        .map((ps) => ps.group)
        .filter(Boolean),
    ),
  );
  allGroupsWithProjects.sort();

  // Add "Ungrouped" only if there are ungrouped projects with simulations
  const groups = [...allGroupsWithProjects];
  if (projectsSimulations.some((ps) => !ps.group && ps.simulations.length > 0)) {
    groups.push("Ungrouped");
  }

  // Get project simulations for selected group - only show projects that have simulations
  const projectsInGroup = Array.from(
    new Map(
      (selectedGroup === "Ungrouped"
        ? projectsSimulations.filter((ps) => !ps.group && ps.simulations.length > 0)
        : projectsSimulations.filter(
            (ps) => ps.group === selectedGroup && ps.simulations.length > 0,
          )
      ).map((ps) => [ps.projectId, { id: ps.projectId, name: ps.projectName }]),
    ).values(),
  );

  // Get all models for the selected project
  const modelsInProject = projectsSimulations.filter(
    (ps) => ps.projectId.toString() === selectedProjectId.toString() && ps.simulations.length > 0,
  );

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
    setSelectedProjectId("");
    setSelectedModelId("");
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedModelId("");
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleConfirm = () => {
    if (selectedModelId) {
      onModelSelect(parseInt(selectedModelId));
      handleOpenChange(false);
    }
  };

  const isConfirmEnabled = selectedGroup && selectedProjectId && selectedModelId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Model</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Group Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium ">Group</label>
            <Select value={selectedGroup} onValueChange={handleGroupChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group === "Ungrouped" ? "No group" : group} (
                    {group === "Ungrouped"
                      ? projectsSimulations.filter((ps) => !ps.group && ps.simulations.length > 0)
                          .length
                      : projectsSimulations.filter(
                          (ps) => ps.group === group && ps.simulations.length > 0,
                        ).length}{" "}
                    projects)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Select - Only show if group is selected and has projects */}
          {selectedGroup && projectsInGroup.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium ">Project</label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsInGroup.map((projectSim) => (
                    <SelectItem key={projectSim.id} value={projectSim.id.toString()}>
                      {projectSim.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Model Select - Only show if project is selected and has models */}
          {selectedProjectId && modelsInProject.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium ">Model</label>
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {modelsInProject.map((modelSim) => (
                    <SelectItem key={modelSim.modelId} value={modelSim.modelId.toString()}>
                      {modelSim.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isConfirmEnabled}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
