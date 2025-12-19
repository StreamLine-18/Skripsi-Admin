// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation } from "@tanstack/react-query";
// import { Link } from "wouter";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { Eye, EyeOff, Lock, Mail, User, UserCheck } from "lucide-react";
// import logo from '@/assets/images/logo.png';

// const registerSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Please enter a valid email address"),
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
//   confirmPassword: z.string(),
//   role: z.enum(["user", "moderator", "admin"]).default("user"),
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"],
// });

// type RegisterFormData = z.infer<typeof registerSchema>;

// export default function Register() {
//   const { toast } = useToast();
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const form = useForm<RegisterFormData>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       username: "",
//       password: "",
//       confirmPassword: "",
//       role: "user",
//     },
//   });

//   const registerMutation = useMutation({
//     mutationFn: async (data: RegisterFormData) => {
//       const { confirmPassword, ...registerData } = data;
      
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(registerData),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Registration failed");
//       }

//       return response.json();
//     },
//     onSuccess: () => {
//       toast({
//         title: "Account created!",
//         description: "Your account has been created successfully. Please sign in.",
//       });
//       // Redirect to login page
//       window.location.href = "/login";
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Registration Failed",
//         description: error.message,
//         variant: "destructive",
//       });
//     },
//   });

//   const onSubmit = (data: RegisterFormData) => {
//     registerMutation.mutate(data);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <img src={logo} alt="Logo" className="flex items-center justify-center mx-auto"/>
//         </div>

//         <Card>
//           <CardHeader className="text-center">
//             <CardTitle>Sign up</CardTitle>
//             <CardDescription>
//               Create a new account to get started
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Full name</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                           <Input
//                             placeholder="Enter your full name"
//                             className="pl-10"
//                             {...field}
//                           />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email address</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                           <Input
//                             type="email"
//                             placeholder="Enter your email"
//                             className="pl-10"
//                             {...field}
//                           />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="username"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Username</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                           <Input
//                             placeholder="Choose a username"
//                             className="pl-10"
//                             {...field}
//                           />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="role"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Role</FormLabel>
//                       <Select onValueChange={field.onChange} defaultValue={field.value}>
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select your role" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="user">User</SelectItem>
//                           <SelectItem value="moderator">Moderator</SelectItem>
//                           <SelectItem value="admin">Admin</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                           <Input
//                             type={showPassword ? "text" : "password"}
//                             placeholder="Create a password"
//                             className="pl-10 pr-10"
//                             {...field}
//                           />
//                           <button
//                             type="button"
//                             className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
//                             onClick={() => setShowPassword(!showPassword)}
//                           >
//                             {showPassword ? (
//                               <EyeOff className="h-4 w-4" />
//                             ) : (
//                               <Eye className="h-4 w-4" />
//                             )}
//                           </button>
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="confirmPassword"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Confirm password</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                           <Input
//                             type={showConfirmPassword ? "text" : "password"}
//                             placeholder="Confirm your password"
//                             className="pl-10 pr-10"
//                             {...field}
//                           />
//                           <button
//                             type="button"
//                             className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
//                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                           >
//                             {showConfirmPassword ? (
//                               <EyeOff className="h-4 w-4" />
//                             ) : (
//                               <Eye className="h-4 w-4" />
//                             )}
//                           </button>
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={registerMutation.isPending}
//                 >
//                   {registerMutation.isPending ? "Creating account..." : "Create account"}
//                 </Button>
//               </form>
//             </Form>

//             <div className="mt-6">
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300" />
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-2 bg-white text-gray-500">Already have an account?</span>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <Link href="/login">
//                   <Button variant="outline" className="w-full">
//                     Sign in instead
//                   </Button>
//                 </Link>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }