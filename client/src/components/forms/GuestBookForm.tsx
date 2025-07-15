import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { guestBookApi } from "@/lib/api";
import type { InsertGuestBook } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// --- Form Schema ---
const formSchema = z.object({
  guest_book_date: z.date({
    required_error: "A date for the guest book is required.",
  }),
});

// --- Component Props ---
interface GuestBookFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function GuestBookForm({ open, onOpenChange, eventId }: GuestBookFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_book_date: new Date(),
    },
  });

  // UPDATED: The mutation function is now simpler.
  // It directly receives the complete payload.
  const mutation = useMutation({
    mutationFn: (data: InsertGuestBook) => {
      return guestBookApi.createGuestBook(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventGuestBooks", eventId] });
      toast({
        title: "Success",
        description: "Guest book entry created successfully.",
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

  // UPDATED: The onSubmit function now creates the complete payload
  // before calling the mutation. This is a safer and clearer approach.
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: InsertGuestBook = {
      guest_book_date: format(values.guest_book_date, "yyyy-MM-dd"),
      id_event: eventId,
    };
    console.log("Submitting Guest Book Entry:", payload);
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Guest Book Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              name="guest_book_date"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
