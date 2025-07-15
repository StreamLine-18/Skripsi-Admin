import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, MedalIcon } from "lucide-react";
import { authApi, type AuthResponse } from "@/lib/api";
import logo from '@/assets/images/logo.png';
import { Link } from "wouter"; // Import the Link component

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

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
      if(response.meta?.success === false) {
        throw new Error(response.meta?.message || "Login failed");
      }
      return response.data;
    },
    onSuccess: async (data: AuthResponse) => {
      localStorage.setItem("access_token", data.access_token);

      try {
        const userResponse = await authApi.getMe();
        const user = userResponse.data;

        if (user.role === 'admin') {
          toast({
            title: "Success",
            description: "Successfully logged in! Redirecting...",
            variant: "default",
          });
          queryClient.invalidateQueries({ queryKey: ['me'] });
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          toast({
            title: "Welcome!",
            description: "Redirecting to the leaderboard...",
            variant: "default",
          });
          setTimeout(() => {
            window.location.href = "/leaderboard/4cfebddd-fe1e-4c7b-a05e-4bb45f4e13d6";
          }, 1000);
        }
      } catch (error) {
        localStorage.removeItem("access_token");
        toast({
          title: "Authentication Error",
          description: "Could not verify user role. Please try again.",
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img src={logo} alt="Logo" className="flex items-center justify-center mx-auto"/>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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

                {/* UPDATED: Added a container for the buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Link href="/leaderboard/8bc1204a-39bb-40d7-b838-df2b8e9b87d4" className="w-full">
                      <Button type="button" variant="outline" className="w-full">
                          <MedalIcon className="h-4 w-4 mr-2" />
                          View Leaderboard
                      </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Copyright &copy; {new Date().getFullYear()} Ruang Ekspresi. All rights reserved.
          </p>
          <p className="text-xs text-gray-100 mt-5">
            StreamLine   
          </p>
        </div>
      </div>
    </div>
  );
}
