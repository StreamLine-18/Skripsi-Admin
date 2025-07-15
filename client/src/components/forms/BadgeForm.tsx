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
import { badgeApi } from "@/lib/api";
import type { BadgeType } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];

const formSchema = z.object({
  name: z.string().min(2, "Badge name must be at least 2 characters."),
  value: z.coerce.number().min(0, "Value must be a positive number."),
  image: z
    .any()
    .refine((files) => files?.length > 0, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png, .webp, and .svg files are accepted."),
});

const editFormSchema = formSchema.extend({
    image: formSchema.shape.image.optional(),
});

// --- Component Props ---
interface BadgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge?: BadgeType;
}

export function BadgeForm({ open, onOpenChange, badge }: BadgeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!badge;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isEditing ? editFormSchema : formSchema),
    defaultValues: { name: "", value: 0, image: undefined },
  });

  useEffect(() => {
    if (badge) {
      form.reset({ name: badge.name, value: badge.value, image: undefined });
    } else {
      form.reset({ name: "", value: 0, image: undefined });
    }
  }, [badge, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      return isEditing
        ? badgeApi.updateBadge(badge.id_badge_type, data)
        : badgeApi.createBadge(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast({ title: "Success", description: `Badge ${isEditing ? 'updated' : 'created'} successfully.` });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('value', String(values.value));
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
          <DialogTitle>{isEditing ? "Edit" : "Add"} Badge Type</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Badge Name</FormLabel><FormControl><Input placeholder="e.g., Gold" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="value" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {isEditing && (
                <div className="text-sm">
                    <FormLabel>Current Image</FormLabel>
                    <img src={badge.image_url} alt={badge.name} className="h-16 w-16 rounded-full object-cover mt-2 bg-slate-200" />
                </div>
            )}
            <FormField name="image" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>{isEditing ? "Upload New Image" : "Image"}</FormLabel><FormControl><Input type="file" {...imageRef} /></FormControl><FormMessage /></FormItem>
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
