import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { eventApi } from "@/lib/api";
import type { Event as EventType } from "@/lib/api";
import { useEffect } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ScrollArea } from "../ui/scroll-area";

// --- Form Schema ---
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
  location: z.string().min(3, "Location is required."),
  event_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  status: z.enum(["Draft", "Published"]),
  image: z.instanceof(FileList).optional(),
});

// --- Component Props ---
interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventItem?: EventType;
}

export function EventForm({ open, onOpenChange, eventItem }: EventFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!eventItem;

    const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  const imageUrl = eventItem?.image_url
    ? `${serverBaseUrl}${eventItem.image_url.replace('/public', '')}`
    : '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      location: "",
      event_date: "",
      status: "Draft",
    },
  });

  useEffect(() => {
    if (eventItem) {
      form.reset({
        title: eventItem.title,
        content: eventItem.content,
        location: eventItem.location,
        // Format tanggal agar sesuai dengan input type="datetime-local"
        event_date: new Date(eventItem.event_date).toISOString().slice(0, 16),
        status: eventItem.status as "Draft" | "Published",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        location: "",
        event_date: "",
        status: "Draft",
      });
    }
  }, [eventItem, form, open]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditing
        ? eventApi.updateEvent(eventItem!.id_event, formData)
        : eventApi.createEvent(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Success",
        description: `Event ${isEditing ? 'updated' : 'created'} successfully.`,
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
    formData.append("title", values.title);
    formData.append("content", values.content);
    formData.append("location", values.location);
    formData.append("event_date", new Date(values.event_date).toISOString());
    formData.append("status", values.status);
    if (values.image && values.image.length > 0) {
      formData.append("image", values.image[0]);
    }
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
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow pr-6">
                <div className="space-y-4 py-4">
                    <FormField name="title" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Event Title" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField name="content" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                            <RichTextEditor 
                                className="h-72 mb-12"
                                value={field.value} 
                                onChange={field.onChange} 
                                placeholder="Describe the event..." 
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField name="location" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Event Location" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="event_date" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Event Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <FormField name="status" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField name="image" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    {isEditing && eventItem?.image_url && (
                        <div className="text-sm">
                            <p className="font-medium">Current Image:</p>
                            <img src={imageUrl} alt={eventItem.title} className="mt-2 rounded-md max-h-40" />
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