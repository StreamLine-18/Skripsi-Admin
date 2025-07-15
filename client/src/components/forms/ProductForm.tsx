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
import { productApi, teamApi, productCategoryApi, eventApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema ---
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().optional(),
  id_team: z.string({ required_error: "Please select a team." }),
  id_category: z.string({ required_error: "Please select a category." }),
  id_event: z.string({ required_error: "Please select an event." }),
  images: z
    .any()
    .refine((files) => files?.length > 0, "At least one image is required.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Each file size must be less than 1MB.`)
    .refine((files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)), ".jpg, .jpeg, .png and .webp files are accepted."),
});

const editFormSchema = formSchema.extend({
    id_team: z.string().optional(),
    id_category: z.string().optional(),
    id_event: z.string().optional(),
    images: formSchema.shape.images.optional(),
});

// --- Component Props ---
interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  // --- Fetch data for dropdowns ---
  // UPDATED: Fetch all teams by sending a large page_size
  const { data: teamsResponse } = useQuery({ 
    queryKey: ["teams", "all"], 
    queryFn: () => teamApi.getTeams({ page_size: 9999 }) 
  });
  const { data: categoriesResponse } = useQuery({ 
    queryKey: ["productCategories", "all"], 
    queryFn: () => productCategoryApi.getProductCategories({ page_size: 9999 }) 
  });
  const { data: eventsResponse } = useQuery({ 
    queryKey: ["events", "all"], 
    queryFn: () => eventApi.getEvents({ page_size: 9999 }) 
  });

  const teams = Array.isArray(teamsResponse?.data) ? teamsResponse?.data : [];
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse?.data : [];
  const events = Array.isArray(eventsResponse?.data) ? eventsResponse?.data : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isEditing ? editFormSchema : formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        id_team: product.id_team,
        id_category: product.id_category,
        id_event: product.id_event,
      });
    } else {
      form.reset({ name: "", description: "" });
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      return isEditing
        ? productApi.updateProduct(product.id_product, data)
        : productApi.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: `Product ${isEditing ? 'updated' : 'created'} successfully.` });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    if (isEditing) {
        formData.append('name', values.name);
        if (values.description) {
            formData.append('description', values.description);
        }
        if (values.images && values.images.length > 0) {
            Array.from(values.images).forEach((file: any) => {
                formData.append('images', file);
            });
        }
    } else {
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('id_team', values.id_team);
        formData.append('id_category', values.id_category);
        formData.append('id_event', values.id_event);
        if (values.images) {
            Array.from(values.images).forEach((file: any) => {
                formData.append('images', file);
            });
        }
    }
    mutation.mutate(formData);
  };
  
  const imagesRef = form.register("images");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-6">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Rentalize App" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField name="id_team" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl>
                  {/* UPDATED: Added classes for scrolling */}
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {teams.map(team => (<SelectItem key={team.id_team} value={team.id_team}>{team.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="id_category" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                   {/* UPDATED: Added classes for scrolling */}
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {categories.map(cat => (<SelectItem key={cat.id_category} value={cat.id_category}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="id_event" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Event</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger></FormControl>
                   {/* UPDATED: Added classes for scrolling */}
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {events.map(evt => (<SelectItem key={evt.id_event} value={evt.id_event}>{evt.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            
            {isEditing && product?.image_urls.length > 0 && (
                <div className="text-sm">
                    <FormLabel>Current Images</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {product.image_urls.map(url => <img key={url} src={url} className="h-20 w-20 rounded-md object-cover bg-slate-200" />)}
                    </div>
                </div>
            )}
            <FormField name="images" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>{isEditing ? "Upload New Images (Optional)" : "Images"}</FormLabel><FormControl><Input type="file" multiple {...imagesRef} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}