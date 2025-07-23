import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { gateApi } from "@/lib/api";
import type { Gate } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Gate name must be at least 3 characters."),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

// --- Component Props ---
interface GateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gate?: Gate; 
}

export function GateForm({ open, onOpenChange, gate }: GateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!gate;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", is_active: true },
  });

  useEffect(() => {
    if (gate) {
      form.reset({
        name: gate.name,
        description: gate.description,
        is_active: gate.is_active,
      });
    } else {
      form.reset({ name: "", description: "", is_active: true });
    }
  }, [gate, form, open]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return isEditing
        ? gateApi.updateGate(gate.id_gate, data)
        : gateApi.createGate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gates"] });
      toast({
        title: "Success",
        description: `Gate ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Gate</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Main Entrance" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the gate" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField name="is_active" control={form.control} render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                   <p className="text-xs text-muted-foreground">
                    Inactive gates cannot be used for new tickets.
                  </p>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
