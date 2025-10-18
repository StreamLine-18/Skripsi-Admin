import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea jika diperlukan
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { destinationApi, gateApi } from "@/lib/api"; // <-- Impor destinationApi dan gateApi
import type { Destination, Gate } from "@/lib/api"; // <-- Impor type Destination dan Gate
import { useEffect } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ScrollArea } from "../ui/scroll-area";

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format (lowercase, numbers, hyphens)"),
  id_gate: z.string({ required_error: "Please select a gate." }),
  description: z.string().optional(),
  features: z.string().optional(),
  facilities: z.string().optional(),
  image: z.instanceof(FileList).optional(),
});

// --- Component Props ---
interface DestinationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationItem?: Destination; // <-- Ganti nama prop
}

export function DestinationForm({ open, onOpenChange, destinationItem }: DestinationFormProps) { // <-- Ganti nama komponen dan prop
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!destinationItem;

  // --- Ambil data Gate untuk dropdown ---
  const { data: gatesResponse } = useQuery({ 
    queryKey: ["gates", "all"], 
    queryFn: () => gateApi.getGates({ pageSize: 999, is_active: true }) // Ambil gate yang aktif saja
  });
  const gates: Gate[] = gatesResponse?.data || [];
  // --- Akhir pengambilan data Gate ---
    const SERVER_ROOT_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  const imageUrl = destinationItem?.image_url
    ? `${SERVER_ROOT_URL}${destinationItem.image_url.replace('/public', '')}`
    : '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      id_gate: "",
      description: "",
      features: "",
      facilities: "",
    },
  });

  // Fungsi untuk membuat slug otomatis
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Hapus karakter non-alfanumerik kecuali spasi dan hyphen
      .trim()
      .replace(/\s+/g, '-') // Ganti spasi dengan hyphen
      .replace(/-+/g, '-'); // Hapus hyphen berlebih
  };

  // Watch perubahan pada field 'name' untuk auto-generate slug
  const nameValue = form.watch('name');
  useEffect(() => {
    if (!isEditing && nameValue) { // Hanya generate saat membuat baru
      form.setValue('slug', generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, form, isEditing]);


  useEffect(() => {
    if (destinationItem) {
      form.reset({
        name: destinationItem.name,
        slug: destinationItem.slug,
        id_gate: destinationItem.id_gate,
        description: destinationItem.description,
        features: destinationItem.features,
        facilities: destinationItem.facilities,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        id_gate: "",
        description: "",
        features: "",
        facilities: "",
      });
    }
  }, [destinationItem, form, open]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditing
        ? destinationApi.updateDestination(destinationItem!.id_destination, formData) // <-- Ganti API call
        : destinationApi.createDestination(formData); // <-- Ganti API call
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] }); // <-- Ganti queryKey
      toast({
        title: "Success",
        description: `Destination ${isEditing ? 'updated' : 'created'} successfully.`,
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
    formData.append("slug", values.slug);
    formData.append("id_gate", values.id_gate);
    if (values.description) formData.append("description", values.description);
    if (values.features) formData.append("features", values.features);
    if (values.facilities) formData.append("facilities", values.facilities);
    if (values.image && values.image.length > 0) {
      formData.append("image", values.image[0]);
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl h-[90vh] flex flex-col" // Dialog besar
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Destination</DialogTitle> {/* <-- Ganti judul */}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow pr-6">
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField name="name" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Destination Name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField name="slug" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="auto-generated-slug" {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <FormField name="id_gate" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Associated Gate</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a gate" /></SelectTrigger></FormControl><SelectContent>{gates.map(gate => (<SelectItem key={gate.id_gate} value={gate.id_gate}>{gate.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    
                    <FormField name="description" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <RichTextEditor 
                                className="h-60 mb-12" // Sesuaikan tinggi jika perlu
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="Describe the destination..." 
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Menggunakan Textarea biasa untuk Features dan Facilities */}
                     <FormField name="features" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Features</FormLabel><FormControl><Textarea placeholder="List features, comma separated or one per line" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField name="facilities" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Facilities</FormLabel><FormControl><Textarea placeholder="List facilities, comma separated or one per line" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                     )} />

                    <FormField name="image" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    {isEditing && destinationItem?.image_url && (
                        <div className="text-sm">
                            <p className="font-medium">Current Image:</p>
                            <img src={imageUrl} alt={destinationItem.name} className="mt-2 rounded-md max-h-40" />
                        </div>
                    )}
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