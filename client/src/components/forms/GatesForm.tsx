import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { gateApi, type Gate } from "@/lib/api";
import { useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { RichTextEditor } from "../ui/RichTextEditor"; // <-- 1. Import RichTextEditor

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Gate name must be at least 3 characters."),
  description: z.string().optional(),
  location: z.string().min(3, "Location is required."),
  is_active: z.boolean().default(true),
  image: z.instanceof(FileList).optional(),
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

  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  const imageUrl = gate?.image_url
    ? `${serverBaseUrl}${gate.image_url.replace('/public', '')}`
    : '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", location: "", is_active: true },
  });

  useEffect(() => {
    if (gate) {
      form.reset({
        name: gate.name,
        description: gate.description,
        location: gate.location,
        is_active: gate.is_active,
      });
    } else {
      form.reset({ name: "", description: "", location: "", is_active: true });
    }
  }, [gate, form, open]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      return isEditing
        ? gateApi.updateGate(gate!.id_gate, data)
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
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.description) formData.append("description", values.description);
    formData.append("location", values.location);
    formData.append("is_active", String(values.is_active));
    if (values.image && values.image.length > 0) {
      formData.append("image", values.image[0]);
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 2. Tambahkan properti untuk mencegah penutupan dan perbesar dialog */}
      <DialogContent 
        className="sm:max-w-4xl h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Gate</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
            {/* 3. Bungkus dengan ScrollArea */}
            <ScrollArea className="flex-grow pr-6">
              <div className="space-y-4 py-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Main Entrance" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                {/* 4. Ganti Textarea dengan RichTextEditor */}
                <FormField name="description" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor 
                        className="h-60 mb-12"
                        value={field.value || ''} 
                        onChange={field.onChange} 
                        placeholder="A short description of the gate..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="location" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., North Gate" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="image" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                )} />
                {isEditing && imageUrl && (
                    <div className="text-sm">
                        <p className="font-medium">Current Image:</p>
                        <img src={imageUrl} alt={gate?.name} className="mt-2 rounded-md max-h-40" />
                    </div>
                )}
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
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
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