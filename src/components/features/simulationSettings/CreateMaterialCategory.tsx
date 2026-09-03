import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { PlusIcon, Edit } from "lucide-react";
import {
  useCreateMaterialCategoryMutation,
  useUpdateMaterialCategoryMutation,
} from "@/store/materialCategoryApi";
import { toast } from "sonner";

const CreateMaterialCategorySchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
});

type CreateMaterialCategoryData = z.infer<typeof CreateMaterialCategorySchema>;

type CreateMaterialCategoryProps = {
  onSubmit?: (categoryId: number) => void;
  category?: { id: number; name: string };
};
export function CreateMaterialCategory({ onSubmit, category }: CreateMaterialCategoryProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!category;
  const [createMaterialCategory, { isLoading: isCreating }] = useCreateMaterialCategoryMutation();
  const [updateMaterialCategory, { isLoading: isUpdating }] = useUpdateMaterialCategoryMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<CreateMaterialCategoryData>({
    resolver: zodResolver(CreateMaterialCategorySchema),
    defaultValues: { name: category?.name ?? "" },
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (open) {
      form.reset({ name: category?.name ?? "" });
    } else {
      form.reset({ name: "" });
    }
  }, [open, form, category]);

  const handleSubmit = async (data: CreateMaterialCategoryData) => {
    try {
      if (isEditMode) {
        const result = await updateMaterialCategory({ id: category.id, ...data }).unwrap();
        onSubmit?.(result.id);
        toast.success("Material category updated successfully");
      } else {
        const result = await createMaterialCategory(data).unwrap();
        onSubmit?.(result.id);
        toast.success("Material category created successfully");
      }
      setOpen(false);
    } catch {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} Material category`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit size={12} />
          </Button>
        ) : (
          <Button className="w-full mt-2">
            <PlusIcon />
            Create Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" onKeyDown={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(handleSubmit)(e);
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Material Category" : "Create Material Category"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the category name."
                  : "Create a new category to organize materials."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {!isLoading
                  ? isEditMode
                    ? "Update"
                    : "Create"
                  : isEditMode
                    ? "Updating"
                    : "Creating"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
