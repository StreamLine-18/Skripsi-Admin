// import { useState, useEffect } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
// import { z } from "zod";
// import { userApi } from "@/lib/api";
// import { queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { User as UserIcon, Mail, Phone, MapPin, Calendar, Settings } from "lucide-react";

// export default function Profile() {
//   const { toast } = useToast();
//   const [isEditing, setIsEditing] = useState(false);

//   // For demo purposes, we'll use the first user as the current user
//   // In a real app, this would come from authentication context
//   const { data: users, isLoading } = useQuery<User[]>({
//     queryKey: ["/api/users"],
//   });

//   const currentUser = users && users.length > 0 ? users[0] : null;

//   const profileSchema = insertUserSchema.omit({ password: true });
//   type ProfileFormData = z.infer<typeof profileSchema>;

//   const form = useForm<ProfileFormData>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       name: currentUser?.name || "",
//       email: currentUser?.email || "",
//       username: currentUser?.username || "",
//       role: (currentUser?.role as "user" | "admin" | "moderator") || "user",
//       status: (currentUser?.status as "active" | "inactive" | "pending") || "active",
//     },
//   });

//   // Update form when user data loads
//   if (currentUser && !isEditing) {
//     form.reset({
//       name: currentUser.name,
//       email: currentUser.email,
//       username: currentUser.username,
//       role: currentUser.role as "user" | "admin" | "moderator",
//       status: currentUser.status as "active" | "inactive" | "pending",
//     });
//   }

//   const updateMutation = useMutation({
//     mutationFn: (data: ProfileFormData) => {
//       if (!currentUser) throw new Error("No user found");
//       return userApi.updateUser(currentUser.id, data);
//     },
//     onSuccess: () => {
//       toast({
//         title: "Profile updated",
//         description: "Your profile has been updated successfully.",
//       });
//       setIsEditing(false);
//       queryClient.invalidateQueries({ queryKey: ["/api/users"] });
//     },
//     onError: (error) => {
//       toast({
//         title: "Error",
//         description: "Failed to update profile. Please try again.",
//         variant: "destructive",
//       });
//       console.error("Profile update error:", error);
//     },
//   });

//   const onSubmit = (data: ProfileFormData) => {
//     updateMutation.mutate(data);
//   };

//   const handleEdit = () => {
//     setIsEditing(true);
//   };

//   const handleCancel = () => {
//     setIsEditing(false);
//     if (currentUser) {
//       form.reset({
//         name: currentUser.name,
//         email: currentUser.email,
//         username: currentUser.username,
//         role: currentUser.role as "user" | "admin" | "moderator",
//         status: currentUser.status as "active" | "inactive" | "pending",
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="container mx-auto py-6">
//         <div className="animate-pulse">
//           <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
//           <div className="h-64 bg-gray-300 rounded"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!currentUser) {
//     return (
//       <div className="container mx-auto py-6">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="text-center text-gray-500">
//               <UserIcon className="mx-auto h-12 w-12 mb-4" />
//               <p>No user profile found. Please create a user account first.</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto py-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
//           <p className="text-muted-foreground">
//             Manage your account settings and preferences
//           </p>
//         </div>
//         {!isEditing && (
//           <Button onClick={handleEdit} className="flex items-center gap-2">
//             <Settings className="h-4 w-4" />
//             Edit Profile
//           </Button>
//         )}
//       </div>

//       <div className="grid gap-6 md:grid-cols-3">
//         {/* Profile Card */}
//         <Card className="md:col-span-1">
//           <CardHeader className="text-center">
//             <Avatar className="mx-auto h-24 w-24">
//               <AvatarFallback className="text-lg">
//                 {currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
//               </AvatarFallback>
//             </Avatar>
//             <CardTitle className="text-xl">{currentUser.name}</CardTitle>
//             <CardDescription>@{currentUser.username}</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Mail className="h-4 w-4" />
//               {currentUser.email}
//             </div>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Calendar className="h-4 w-4" />
//               Joined {new Date(currentUser.createdAt).toLocaleDateString()}
//             </div>
//             <div className="flex items-center gap-2">
//               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                 currentUser.status === 'active' 
//                   ? 'bg-green-100 text-green-800' 
//                   : currentUser.status === 'inactive'
//                   ? 'bg-gray-100 text-gray-800'
//                   : 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 {currentUser.status}
//               </span>
//               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                 currentUser.role === 'admin' 
//                   ? 'bg-purple-100 text-purple-800' 
//                   : currentUser.role === 'moderator'
//                   ? 'bg-blue-100 text-blue-800'
//                   : 'bg-gray-100 text-gray-800'
//               }`}>
//                 {currentUser.role}
//               </span>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Profile Form */}
//         <Card className="md:col-span-2">
//           <CardHeader>
//             <CardTitle>Profile Information</CardTitle>
//             <CardDescription>
//               {isEditing ? "Update your profile information below" : "Your current profile information"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="name"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Full Name</FormLabel>
//                         <FormControl>
//                           <Input 
//                             placeholder="Enter your full name" 
//                             {...field} 
//                             disabled={!isEditing}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="username"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Username</FormLabel>
//                         <FormControl>
//                           <Input 
//                             placeholder="Enter your username" 
//                             {...field} 
//                             disabled={!isEditing}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email Address</FormLabel>
//                       <FormControl>
//                         <Input 
//                           type="email" 
//                           placeholder="Enter your email" 
//                           {...field} 
//                           disabled={!isEditing}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="role"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Role</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select role" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="admin">Admin</SelectItem>
//                             <SelectItem value="moderator">Moderator</SelectItem>
//                             <SelectItem value="user">User</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="status"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Status</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select status" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="active">Active</SelectItem>
//                             <SelectItem value="inactive">Inactive</SelectItem>
//                             <SelectItem value="pending">Pending</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 {isEditing && (
//                   <div className="flex justify-end gap-2 pt-4">
//                     <Button type="button" variant="outline" onClick={handleCancel}>
//                       Cancel
//                     </Button>
//                     <Button type="submit" disabled={updateMutation.isPending}>
//                       {updateMutation.isPending ? "Saving..." : "Save Changes"}
//                     </Button>
//                   </div>
//                 )}
//               </form>
//             </Form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }