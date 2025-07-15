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
import { bannerApi } from "@/lib/api";
import type { Banner } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema for File Upload ---
const MAX_FILE_SIZE = 1000000; 
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length > 0, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  is_active: z.boolean().default(true),
});

// Schema for editing, where the image is optional
const editFormSchema = formSchema.extend({
    image: formSchema.shape.image.optional(),
});


// --- Component Props ---
interface BannerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner; // Optional banner for editing
}

export function BannerForm({ open, onOpenChange, banner }: BannerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!banner;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isEditing ? editFormSchema : formSchema),
    defaultValues: {
      image: undefined,
      is_active: true,
    },
  });

  // --- Reset form when banner data changes (for editing) ---
  useEffect(() => {
    if (banner) {
      form.reset({
        is_active: banner.is_active,
        image: undefined,
      });
    } else {
      form.reset({
        is_active: true,
        image: undefined,
      });
    }
  }, [banner, form]);

  // --- Create/Update Mutation ---
  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (isEditing) {
        return bannerApi.updateBanner(banner.id_banner, data);
      } else {
        return bannerApi.createBanner(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({
        title: "Success",
        description: `Banner ${isEditing ? 'updated' : 'created'} successfully.`,
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

  // --- Form Submit Handler ---
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('is_active', String(values.is_active));
    if (values.image && values.image.length > 0) {
      formData.append('image', values.image[0]);
    }
    mutation.mutate(formData);
  };
  
  const imageRef = form.register("image");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Banner</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {isEditing && (
                <div className="text-sm">
                    <FormLabel>Current Image</FormLabel>
                    <img src={banner.image_url} alt="Banner" className="w-full h-auto object-cover mt-2 rounded-md bg-slate-200" />
                </div>
            )}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? "Upload New Image" : "Image"}</FormLabel>
                  <FormControl>
                    <Input type="file" {...imageRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
