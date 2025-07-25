import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { ticketPriceApi, gateApi, visitorCategoryApi, dayTypeApi } from "@/lib/api";
import type { TicketPrice, Gate, VisitorCategory, DayType, InsertTicketPrice } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schema ---
const formSchema = z.object({
  id_gate: z.string({ required_error: "Please select a gate." }),
  id_category: z.string({ required_error: "Please select a visitor category." }),
  id_day_type: z.string({ required_error: "Please select a day type." }),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  is_active: z.boolean().default(true),
});

// --- Component Props ---
interface TicketPriceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketPrice?: TicketPrice;
}

export function TicketPriceForm({ open, onOpenChange, ticketPrice }: TicketPriceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!ticketPrice;

  // Fetch data for dropdowns
  const { data: gatesResponse } = useQuery({ queryKey: ["gates", "all"], queryFn: () => gateApi.getGates({ pageSize: 999 }) });
  const { data: categoriesResponse } = useQuery({ queryKey: ["visitorCategories", "all"], queryFn: () => visitorCategoryApi.getVisitorCategories({ pageSize: 999 }) });
  const { data: dayTypesResponse } = useQuery({ queryKey: ["dayTypes", "all"], queryFn: () => dayTypeApi.getDayTypes({ pageSize: 999 }) });

  const gates: Gate[] = gatesResponse?.data || [];
  const categories: VisitorCategory[] = categoriesResponse?.data || [];
  const dayTypes: DayType[] = dayTypesResponse?.data || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { is_active: true },
  });

  useEffect(() => {
    if (open && ticketPrice) {
      form.reset({
        id_gate: ticketPrice.id_gate,
        id_category: ticketPrice.id_category,
        id_day_type: ticketPrice.id_day_type,
        price: ticketPrice.price,
        is_active: ticketPrice.is_active,
      });
    } else if (open && !ticketPrice) {
      form.reset({
        id_gate: "",
        id_category: "",
        id_day_type: "",
        price: 0,
        is_active: true,
      });
    }
  }, [ticketPrice, form, open]);

  const mutation = useMutation({
    mutationFn: (data: InsertTicketPrice) => {
      return isEditing
        ? ticketPriceApi.updateTicketPrice(ticketPrice.id_ticket_price, data)
        : ticketPriceApi.createTicketPrice(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketPrices"] });
      toast({
        title: "Success",
        description: `Ticket price ${isEditing ? 'updated' : 'created'} successfully.`,
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
          <DialogTitle>{isEditing ? "Edit" : "Add New"} Ticket Price</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="id_gate" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Gate</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a gate" /></SelectTrigger></FormControl><SelectContent>{gates.map(g => (<SelectItem key={g.id_gate} value={g.id_gate}>{g.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField name="id_category" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Visitor Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => (<SelectItem key={c.id_category} value={c.id_category}>{c.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField name="id_day_type" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Day Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a day type" /></SelectTrigger></FormControl><SelectContent>{dayTypes.map(d => (<SelectItem key={d.id_day_type} value={d.id_day_type}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField name="price" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Price (IDR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="is_active" control={form.control} render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>Active</FormLabel><p className="text-xs text-muted-foreground">Inactive prices cannot be used for new bookings.</p></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
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
