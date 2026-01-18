import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { useDispatch } from "react-redux";
import { removeGroup, addGroup } from "@/store/projectSlice";
import { useUpdateProjectsByGroupMutation } from "@/store/projectApi";

const EditGroupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
});

type EditGroupData = z.infer<typeof EditGroupSchema>;

type EditGroupProps = {
  currentGroupName: string;
  trigger?: React.ReactNode;
  projectIds?: number[];
};

export function EditGroup({ currentGroupName, trigger, projectIds }: EditGroupProps) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const [updateProjectsByGroup, { isLoading }] = useUpdateProjectsByGroupMutation();

  const form = useForm<EditGroupData>({
    resolver: zodResolver(EditGroupSchema),
    defaultValues: { name: currentGroupName },
  });

  // Reset form when dialog opens with current group name
  useEffect(() => {
    if (open) {
      form.reset({ name: currentGroupName });
    }
  }, [open, currentGroupName, form]);

  const onSubmit = async (data: EditGroupData) => {
    if (data.name === currentGroupName) {
      setOpen(false);
      return;
    }

    try {
      // Update all projects in this group to new group name
      await updateProjectsByGroup({
        group: currentGroupName,
        newGroup: data.name,
        projectIds,
      }).unwrap();

      // Update Redux state
      dispatch(removeGroup(currentGroupName));
      dispatch(addGroup(data.name));

      toast.success("Group renamed successfully");
      setOpen(false);
    } catch (error) {
      console.error("Failed to rename group:", error);
      toast.error("Failed to rename group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            Edit Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" onKeyDown={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSubmit)(e);
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Rename the group "{currentGroupName}". All projects in this group will be updated.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder="Group name"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
