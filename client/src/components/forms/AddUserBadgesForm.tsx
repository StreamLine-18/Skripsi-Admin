import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { badgeApi, eventApi } from "@/lib/api";
import type { AddUserBadge } from "@/lib/api";

// --- Form Schema ---
// The schema only includes fields the user interacts with.
const formSchema = z.object({
  id_event: z.string({ required_error: "Please select an event." }),
  id_badge_type: z.string({ required_error: "Please select a badge type." }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

// --- Component Props ---
interface AddUserBadgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function AddUserBadgeForm({ open, onOpenChange, userId }: AddUserBadgeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data for dropdowns
  const { data: eventsResponse } = useQuery({ queryKey: ["events"], queryFn: eventApi.getEvents });
  const { data: badgesResponse } = useQuery({ queryKey: ["badges"], queryFn: badgeApi.getBadges });
  
  const events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
  const badgeTypes = Array.isArray(badgesResponse?.data) ? badgesResponse.data : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { quantity: 1 },
  });

  // UPDATED: The mutation now calls the correct 'assignBadge' function
  const mutation = useMutation({
    mutationFn: (values: AddUserBadge) => badgeApi.assignBadge(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges", userId] });
      toast({ title: "Success", description: "Badge Add successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to Add badge.", variant: "destructive" });
    },
  });

  // UPDATED: The onSubmit function now constructs the full payload,
  // including the userId from the component's props, before calling the mutation.
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: AddUserBadge = {
      ...values,
      id_user: userId,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Badge</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="id_event" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Event</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger></FormControl><SelectContent>{events.map(evt => (<SelectItem key={evt.id_event} value={evt.id_event}>{evt.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField name="id_badge_type" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Badge Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a badge type" /></SelectTrigger></FormControl><SelectContent>{badgeTypes.map(badge => (<SelectItem key={badge.id_badge_type} value={badge.id_badge_type}>{badge.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField name="quantity" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Adding Badge..." : "Add Badge"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
