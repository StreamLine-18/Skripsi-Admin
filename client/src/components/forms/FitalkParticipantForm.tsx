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
import { fitalkApi } from "@/lib/api";
import type { InsertFitalkParticipant } from "@/lib/api";

// --- Form Schema ---
// The schema no longer includes id_event, as it's passed via props.
const formSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  registration_id: z.string().min(1, "Registration ID is required."),
  home_institution: z.string().min(2, "Home institution is required."),
});

// --- Component Props ---
interface FitalkParticipantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string; // The ID of the event to add the participant to.
}

export function FitalkParticipantForm({ open, onOpenChange, eventId }: FitalkParticipantFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { full_name: "", email: "", registration_id: "", home_institution: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: InsertFitalkParticipant) => fitalkApi.addParticipant(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitalkParticipants", eventId] });
      toast({ title: "Success", description: "Participant added successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add participant.", variant: "destructive" });
    },
  });

  // The onSubmit function now correctly includes the eventId from props.
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: InsertFitalkParticipant = {
        ...values,
        id_event: eventId,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Fitalk Participant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="full_name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="registration_id" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Registration ID</FormLabel><FormControl><Input placeholder="e.g., FITALK-123" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="home_institution" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Home Institution</FormLabel><FormControl><Input placeholder="e.g., University of Technology" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Adding..." : "Add Participant"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
