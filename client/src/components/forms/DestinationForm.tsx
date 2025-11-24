import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { destinationApi, gateApi } from "@/lib/api";
import type { Destination, Gate } from "@/lib/api";
import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ScrollArea } from "../ui/scroll-area";
import { getImageUrl } from "@/lib/imageUtils";

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format (lowercase, numbers, hyphens)"),
  id_gate: z.string({ required_error: "Please select a gate." }),
  description: z.string().optional(),
  features: z.string().optional(),
  facilities: z.string().optional(),
  status: z.enum(["Draft", "Published"]).default("Draft"),
  image: z.instanceof(FileList).optional(),
});

// --- Component Props ---
interface DestinationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationItem?: Destination;
}

export function DestinationForm({ open, onOpenChange, destinationItem }: DestinationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!destinationItem;
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: gatesResponse } = useQuery({ 
    queryKey: ["gates", "all"], 
    queryFn: () => gateApi.getGates({ pageSize: 999 })
  });
  const gates: Gate[] = gatesResponse?.data || [];
  const imageUrl = destinationItem?.image_url ? getImageUrl(destinationItem.image_url) : '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      id_gate: "",
      description: "",
      features: "",
      facilities: "",
      status: "Draft",
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const nameValue = form.watch('name');
  useEffect(() => {
    if (!isEditing && nameValue) {
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
        status: (destinationItem.status as "Draft" | "Published") || "Draft",
      });
      setPreviewImage(null); // Reset preview when editing
    } else {
      form.reset({
        name: "",
        slug: "",
        id_gate: "",
        description: "",
        features: "",
        facilities: "",
        status: "Draft",
      });
      setPreviewImage(null); // Reset preview when creating new
    }
  }, [destinationItem, form, open]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditing
        ? destinationApi.updateDestination(destinationItem!.id_destination, formData)
        : destinationApi.createDestination(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
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
    formData.append("status", values.status);
    if (values.description) formData.append("description", values.description);
    if (values.features) formData.append("features", values.features);
    if (values.facilities) formData.append("facilities", values.facilities);
    if (values.image && values.image.length > 0) {
      formData.append("image", values.image[0]);
    }
    
    // Log the payload
    console.log("=== Destination Form Payload ===");
    console.log("Form Values:", values);
    console.log("FormData entries:");
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`${key}:`, `File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}:`, value);
      }
    });
    console.log("================================");
    
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Destination</DialogTitle>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField name="id_gate" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Associated Gate</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a gate" /></SelectTrigger></FormControl><SelectContent>{gates.map(gate => (<SelectItem key={gate.id_gate} value={gate.id_gate}>{gate.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                      )} />
                      
                      <FormField name="status" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    
                    <FormField name="description" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <RichTextEditor 
                                className="h-60 mb-12"
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="Describe the destination..." 
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                     <FormField name="features" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Features</FormLabel>
                        <FormControl>                            
                        <RichTextEditor 
                                className="h-60 mb-12" 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="Describe the Features..." 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                     )} />
                     <FormField name="facilities" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Facilities</FormLabel>
                        <FormControl>
                        <RichTextEditor 
                                className="h-60 mb-12" 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="Describe the Facilities..." 
                            />
                        </FormControl><FormMessage />
                        </FormItem>
                     )} />

                    <FormField name="image" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                field.onChange(e.target.files);
                                // Create preview for new image
                                if (e.target.files && e.target.files[0]) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPreviewImage(reader.result as string);
                                  };
                                  reader.readAsDataURL(e.target.files[0]);
                                } else {
                                  setPreviewImage(null);
                                }
                              }} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )} />
                    
                    {/* Current Image (when editing) */}
                    {isEditing && destinationItem?.image_url && (
                        <div className="text-sm">
                            <p className="font-medium">Current Image:</p>
                            <img 
                              src={imageUrl} 
                              alt={destinationItem.name} 
                              className="mt-2 rounded-md max-h-40 border" 
                              onError={(e) => {
                                console.error("Image failed to load:", imageUrl);
                                e.currentTarget.src = "https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found";
                              }}
                            />
                        </div>
                    )}
                    
                    {/* New Image Preview */}
                    {previewImage && (
                        <div className="text-sm">
                            <p className="font-medium text-green-600">New Image Preview:</p>
                            <img 
                              src={previewImage} 
                              alt="Preview" 
                              className="mt-2 rounded-md max-h-40 border border-green-500" 
                            />
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
