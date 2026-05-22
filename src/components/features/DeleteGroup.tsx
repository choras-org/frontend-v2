import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  useDeleteProjectsByGroupMutation,
  useUpdateProjectsByGroupMutation,
} from "@/store/projectApi";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { removeGroup } from "@/store/projectSlice";

type DeleteGroupProps = {
  group: string;
  projectsCount: number; // Optional: number of projects in the group
};

export function DeleteGroup({ group, projectsCount }: DeleteGroupProps) {
  const [open, setOpen] = useState(false);
  const [deleteProjectByGroup, { isLoading: isDeleting }] = useDeleteProjectsByGroupMutation();
  const [updateProjectsByGroup, { isLoading: isUpdating }] = useUpdateProjectsByGroupMutation();
  const dispatch = useDispatch();

  const handleUpdateProjects = async () => {
    try {
      console.log(`Update group: ${group}`);
      // Update projects first (set group to empty)
      await updateProjectsByGroup({ group, newGroup: "" }).unwrap();
      // Then remove group from Redux state (will sync to localStorage automatically)
      dispatch(removeGroup(group));
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    }
  };
  const handleDeleteProjects = async () => {
    try {
      console.log(`Delete all projects: ${group}`);
      await deleteProjectByGroup(group === "NONE" ? "" : group).unwrap();
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete projects:", error);
      toast.error("Failed to delete projects");
    }
  };

  if (projectsCount === 0 && group === "NONE") {
    return null; // Don't render anything if there are no projects in "NONE" group
  }

  return (
    <ConfirmDialog
      title={group === "NONE" ? "Delete Projects" : `Delete Group "${group}"`}
      description={
        group === "NONE"
          ? `Are you sure you want to delete? This action cannot be undone.`
          : `Are you sure you want to delete group "${group}"? This action cannot be undone.`
      }
      trigger={
        <Button variant="ghost" size="sm" className="text-red-600">
          Delete group
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
      footer={
        <div className="flex gap-2 w-full justify-between">
          <Button variant="outline" disabled={isDeleting} onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {group !== "NONE" && (
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                disabled={isUpdating}
                onClick={handleUpdateProjects}
                aria-busy={isUpdating}
              >
                {isUpdating ? "Deleting…" : "Delete Group Only"}
              </Button>
            )}

            {projectsCount > 0 && (
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDeleteProjects}
                aria-busy={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete Projects"}
              </Button>
            )}
          </div>
        </div>
      }
    />
  );
}
