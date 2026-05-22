import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSimulationMutation,
  useUpdateSimulationMutation,
  useLazyGetSimulationsByModelIdQuery,
} from "@/store/simulationApi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useInitializeSimulationSettings } from "@/hooks/useInitializeSimulationSettings";

const SimulationFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().optional(),
  status: z.string().optional(),
});

type SimulationFormData = z.infer<typeof SimulationFormSchema>;

type SimulationFormProps = {
  modelId: number;
  id?: number;
  defaultValues?: Partial<SimulationFormData>;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};
export function SimulationForm({
  modelId,
  id,
  defaultValues,
  trigger,
  onSuccess,
}: SimulationFormProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const form = useForm<SimulationFormData>({
    resolver: zodResolver(SimulationFormSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
    },
  });
  const [createSimulation, { isLoading: isCreating }] = useCreateSimulationMutation();
  const [updateSimulation, { isLoading: isUpdating }] = useUpdateSimulationMutation();
  const [getSimulationsByModelId] = useLazyGetSimulationsByModelIdQuery();
  const { initializeSettings } = useInitializeSimulationSettings();

  const isLoading = isCreating || isUpdating;
  const isEdit = Boolean(id);
  const label = isEdit ? "Edit" : "Create new";

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (data: SimulationFormData) => {
    try {
      if (isEdit && id) {
        await updateSimulation({
          id,
          body: {
            ...data,
            modelId,
          },
        }).unwrap();
        // Refetch simulations to update the list
        await getSimulationsByModelId(modelId).unwrap();
        toast.success("Simulation updated successfully");
      } else {
        const result = await createSimulation({
          ...data,
          modelId,
          layerIdByMaterialId: {},
          solverSettings: {
            simulationSettings: {},
          },
        }).unwrap();

        await initializeSettings(result);

        await getSimulationsByModelId(modelId).unwrap();

        // Navigate to editor for new simulations
        navigate(`/editor/${modelId}/${result.id}`);
        toast.success("Simulation created successfully. Setting initialized");
      }

      onSuccess?.();

      setOpen(false);
    } catch {
      if (isEdit) {
        toast.error("Failed to update simulation");
      } else {
        toast.error("Failed to create simulation");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="secondary"
            className="bg-choras-dark border border-choras-primary text-choras-primary hover:bg-white hover:text-choras-dark cursor-pointer"
          >
            {label} Simulation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{label} Simulation</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Edit your simulation details."
                  : "Create a new simulation for your project."}
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
                      <Input
                        autoComplete="off"
                        disabled={isLoading}
                        placeholder="Simulation name"
                        {...field}
                        onFocus={(e) => {
                          // HACK: Prevent auto-selection by moving cursor to end
                          if (isEdit) {
                            setTimeout(() => {
                              const input = e.target;
                              const length = input.value.length;
                              input.setSelectionRange(length, length);
                            }, 10);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Short simulation description"
                        {...field}
                      />
                    </FormControl>
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
                {isLoading
                  ? isEdit
                    ? "Updating..."
                    : "Creating..."
                  : isEdit
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
