import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authApi, type AuthResponse } from "@/lib/api";
import logo from '@/assets/images/logo.png';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await authApi.login(data);
      if (response.meta?.success === false) {
        throw new Error(response.meta?.message || "Login failed");
      }
      return response.data;
    },
    onSuccess: (data: AuthResponse | null) => {
      if (!data) {
        throw new Error("Login response did not contain data.");
      }

      // Check the user's role from the login response
      if (data.role === "admin") {
        localStorage.setItem("access_token", data.accessToken);
        console.log("Login successful:", data);

        toast({
          title: "Success",
          description: "Successfully logged in!",
          variant: "default",
        });

        // Invalidate queries and navigate immediately
        queryClient.invalidateQueries({ queryKey: ['me'] });
        setLocation("/"); // Use wouter navigation instead of window.location
      } else {
        // If not an admin, deny access
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin panel.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <img 
              src={logo} 
              alt="Alas Purwo" 
              className="w-32 h-32 mx-auto mb-4 drop-shadow-sm" 
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6 pb-8 px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="admin@example.com"
                            className="pl-10 h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 mt-6 bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Alas Purwo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}