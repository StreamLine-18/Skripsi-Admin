// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { User as UserIcon, Mail, ChevronLeft, ChevronRight, Search, Plus, Upload } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/ui/data-table";
// import { Input } from "@/components/ui/input";
// import { userApi } from "@/lib/api";
// import type { User } from "@/lib/api";
// import { Link } from "wouter";
// import { Button } from "@/components/ui/button";
// import {UserForm} from "@/components/forms/UserForm";

// // Debounce Hook for search input
// function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedValue(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// }

// export default function Users() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState("");
//   const debouncedSearchTerm = useDebounce(searchTerm, 500);
//   const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);

//   // Reset to first page when search term changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedSearchTerm]);

//   const { data: apiResponse, isLoading } = useQuery({
//     queryKey: ["users", currentPage, debouncedSearchTerm],
//     queryFn: () =>
//       userApi.getUsers({
//         page: currentPage,
//         email: debouncedSearchTerm || undefined,
//       }),
//     placeholderData: (keepPreviousData) => keepPreviousData,
//   });

//   const users: User[] = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
//   const pagination = apiResponse?.pagination;

//   const columns = [
//     {
//       key: "name",
//       label: "User",
//       render: (user: User) => (
//         <Link href={`/users/${user.id_user}/badges`} className="flex items-center group cursor-pointer">
//           <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
//             <UserIcon className="h-5 w-5 text-slate-600" />
//           </div>
//           <div className="ml-4">
//             <div className="text-sm font-medium text-slate-900 group-hover:underline">{user.full_name}</div>
//             <div className="text-xs text-slate-500 font-mono">{user.id_user}</div>
//           </div>
//         </Link>
//       ),
//     },
//     {
//       key: "email",
//       label: "Email",
//       render: (user: User) => (
//         <div className="flex items-center text-sm text-slate-600">
//           <Mail className="h-4 w-4 mr-2" />
//           {user.email}
//         </div>
//       ),
//     },
//     {
//       key: "role",
//       label: "Role",
//       render: (user: User) => (
//         <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
//           {user.role}
//         </Badge>
//       ),
//     },
//   ];

//   return (
//     <div className="p-4 md:p-6">
//       <div className="md:flex md:items-center md:justify-between mb-4">
//         <div className="flex-1 min-w-0">
//           <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
//             Users
//           </h2>
//           <p className="mt-1 text-sm text-slate-500">
//             A list of all users in the system.
//           </p>
//         </div>
//         <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//             <Input
//               type="text"
//               placeholder="Search by email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 w-full md:w-64"
//             />
//           </div>
//           <Button variant="outline" onClick={() => setIsBulkFormOpen(true)}>
//             <Upload className="h-4 w-4 mr-2" />
//             Insert User
//           </Button>
//         </div>
//       </div>

//       <DataTable
//         title="All Users"
//         description="Browse and manage system users."
//         data={users.map(user => ({ ...user, id: user.id_user }))}
//         columns={columns}
//         loading={isLoading}
//       />

//       {pagination && pagination.total_pages > 1 && (
//         <div className="flex items-center justify-end space-x-2 py-4">
//           <span className="text-sm text-muted-foreground">
//             Page {pagination.page} of {pagination.total_pages}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={pagination.page === 1}
//           >
//             <ChevronLeft className="w-4 h-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
//             disabled={pagination.page === pagination.total_pages}
//           >
//             <ChevronRight className="w-4 h-4" />
//           </Button>
//         </div>
//       )}

//       <UserForm 
//         open={isBulkFormOpen}
//         onOpenChange={setIsBulkFormOpen}
//       />
//     </div>
//   );
// }



