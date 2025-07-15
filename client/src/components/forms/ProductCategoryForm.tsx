import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { productCategoryApi } from "@/lib/api";
import type { ProductCategory } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema for File Upload ---
const MAX_FILE_SIZE = 1000000; 
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  icon: z
    .any()
    .refine((files) => files?.length > 0, "Icon image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 1MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

// Schema for editing, where the icon is optional
const editFormSchema = formSchema.extend({
    icon: formSchema.shape.icon.optional(),
});


// --- Component Props ---
interface ProductCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProductCategory; // Optional category for editing
}

export function ProductCategoryForm({ open, onOpenChange, category }: ProductCategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isEditing ? editFormSchema : formSchema),
    defaultValues: {
      name: "",
      icon: undefined,
    },
  });

  // --- Reset form when category data changes (for editing) ---
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: undefined, // File input cannot be programmatically set
      });
    } else {
      form.reset({
        name: "",
        icon: undefined,
      });
    }
  }, [category, form]);

  // --- Create/Update Mutation ---
  const mutation = useMutation({
    mutationFn: (data: FormData) => {

      if (isEditing) {
        console.log("Updating category:", category.id_category, data);
        return productCategoryApi.updateProductCategory(category.id_category, data);
      } else {
        return productCategoryApi.createProductCategory(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      toast({
        title: "Success",
        description: `Product category ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
        console.error("Error saving product category:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Form Submit Handler ---
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('name', values.name);
    // Only append the icon if a new file was selected
    if (values.icon && values.icon.length > 0) {
      formData.append('icon', values.icon[0]);
    }
    mutation.mutate(formData);

    console.log("Form submitted:", values);
  };
  
  const iconRef = form.register("icon");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Product Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mobile Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
                <div className="text-sm">
                    <FormLabel>Current Icon</FormLabel>
                    <img src={category.icon_url} alt={category.name} className="h-16 w-16 rounded-full object-cover mt-2 bg-slate-200" />
                </div>
            )}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? "Upload New Icon" : "Icon"}</FormLabel>
                  <FormControl>
                    <Input type="file" {...iconRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
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
