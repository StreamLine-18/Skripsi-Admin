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
import { userApi, roleApi } from "@/lib/api";
import type { User, InsertUser, Role } from "@/lib/api";
import { useEffect } from "react";

// --- Form Schemas ---
const createUserSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  id_role: z.string({ required_error: "Please select a role." }),
});

const updateUserSchema = createUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});


// --- Component Props ---
interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User; // Optional user for editing
}

export function UserForm({ open, onOpenChange, user }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  // Fetch roles for the dropdown
  const { data: rolesResponse } = useQuery({
      queryKey: ["roles"],
      queryFn: () => roleApi.getRoles({ pageSize: 100 }) // Fetch all roles
  });
  const roles: Role[] = rolesResponse?.data || [];

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      id_role: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name,
        email: user.email,
        id_role: user.id_role,
        password: "", // Password is not pre-filled for security
      });
    } else {
      form.reset();
    }
  }, [user, form, open]);

  const mutation = useMutation({
    mutationFn: (data: InsertUser) => {
      // Don't send an empty password field on update
      if (isEditing && !data.password) {
          delete data.password;
      }
      return isEditing
        ? userApi.updateUser(user.id_user, data)
        : userApi.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: `User ${isEditing ? 'updated' : 'created'} successfully.`,
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

  const onSubmit = (values: z.infer<typeof createUserSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add New"} User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="full_name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="e.g., user@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="password" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter password"} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="id_role" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{roles.map(role => (<SelectItem key={role.id_role} value={role.id_role}>{role.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
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
