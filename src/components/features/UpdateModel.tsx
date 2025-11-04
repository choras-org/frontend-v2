import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
import { useUpdateModelMutation } from "@/store/modelApi";

const UpdateModelSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
});

type UpdateModelData = z.infer<typeof UpdateModelSchema>;

type UpdateModelProps = {
  modelId: string;
  modelName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};
export function UpdateModel({ trigger, onSuccess, modelId, modelName }: UpdateModelProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateModel] = useUpdateModelMutation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm({
    resolver: zodResolver(UpdateModelSchema),
    defaultValues: {
      name: modelName,
    },
  });

  const onSubmit = async (data: UpdateModelData) => {
    try {
      setIsSubmitting(true);
      await updateModel({ id: Number(modelId), name: data.name }).unwrap();

      setOpen(false);
      onSuccess?.();
      toast.success("Model updated successfully.");
    } catch (_) {
      toast.error("Error updating model. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // reset form when dialog is closed
    if (!open) {
      form.reset();
      if (fileInputRef.current?.value) fileInputRef.current.value = "";
    }
  }, [open, form]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger ?? <Button>Update Model</Button>}</DialogTrigger>
      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Update Model</DialogTitle>
              <DialogDescription>Update your model here.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Model Name" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isSubmitting} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
