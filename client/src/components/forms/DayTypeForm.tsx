import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { dayTypeApi } from "@/lib/api";
import type { DayType } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Day type name must be at least 3 characters."),
  description: z.string().optional(),
});

// --- Component Props ---
interface DayTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayType?: DayType; 
}

export function DayTypeForm({ open, onOpenChange, dayType }: DayTypeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!dayType;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (dayType) {
      form.reset({
        name: dayType.name,
        description: dayType.description,
      });
    } else {
      form.reset({ name: "", description: "" });
    }
  }, [dayType, form, open]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return isEditing
        ? dayTypeApi.updateDayType(dayType.id_day_type, data)
        : dayTypeApi.createDayType(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dayTypes"] });
      toast({
        title: "Success",
        description: `Day type ${isEditing ? 'updated' : 'created'} successfully.`,
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
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Day Type</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Weekday" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description" {...field} /></FormControl><FormMessage /></FormItem>
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
