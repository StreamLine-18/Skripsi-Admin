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
import type { InsertFitalkAttendance } from "@/lib/api";

// --- Form Schema ---
const formSchema = z.object({
  registration_id: z.string().min(1, "Registration ID is required."),
});

// --- Component Props ---
interface FitalkAttendanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function FitalkAttendanceForm({ open, onOpenChange, eventId }: FitalkAttendanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { registration_id: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: InsertFitalkAttendance) => fitalkApi.addAttendance(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitalkAttendances"] });
      toast({ title: "Success", description: "Attendance recorded successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record attendance.", variant: "destructive" });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: InsertFitalkAttendance = {
        ...values,
        id_event: eventId,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Fitalk Attendance</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="registration_id" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Registration ID</FormLabel>
                <FormControl><Input placeholder="e.g., FPX-1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Recording..." : "Record Attendance"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
