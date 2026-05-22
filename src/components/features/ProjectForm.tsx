import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CreateGroup } from "./CreateGroup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCreateProjectMutation, useUpdateProjectMutation } from "@/store/projectApi";
import { Textarea } from "@/components/ui/textarea";
import type { RootState } from "@/store";

const ProjectFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().optional(),
  group: z.string().optional(),
});

type ProjectFormData = z.infer<typeof ProjectFormSchema>;

type ProjectFormProps = {
  id?: number;
  defaultValues?: Partial<ProjectFormData>;
  trigger?: React.ReactNode;
  groupOnly?: boolean; // If true, only show the group select field
};
export function ProjectForm({ id, defaultValues, trigger, groupOnly }: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
      group: "",
    },
  });
  const [open, setOpen] = useState(false);
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const isLoading = isCreating || isUpdating;
  const isEdit = !!id;
  const label = isEdit ? "Edit" : "Create new";

  // Controlling the Select open state to close it when a new group is created
  const [selectOpen, setSelectOpen] = useState(false);

  // We get the groups from Redux state directly
  const groups = useSelector((state: RootState) => state.project.groups);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit) {
        await updateProject({ id, ...data }).unwrap();
        toast.success("Project updated successfully");
      } else {
        await createProject(data).unwrap();
        toast.success("Project created successfully");
      }
      setOpen(false);
    } catch (_) {
      if (isEdit) {
        toast.error("Failed to update project");
      } else {
        toast.error("Failed to create project");
      }
    }
  };

  const handleCreateGroup = (name: string) => {
    setSelectOpen(false);
    toast.success(`Group "${name}" selected`);
    setTimeout(() => {
      form.setValue("group", name);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>{label} project</Button>}</DialogTrigger>
      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{label} Project</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Edit your project details."
                  : "Create a new project to organize your models and simulations."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              {!groupOnly && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!groupOnly && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Short project description"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "NONE" ? "" : val)}
                      value={field.value}
                      disabled={isLoading}
                      open={selectOpen}
                      onOpenChange={setSelectOpen}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}

                        {/* Create Group */}
                        <CreateGroup onCreate={handleCreateGroup} />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isLoading} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
