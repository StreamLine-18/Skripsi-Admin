import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "@/components/layout/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
// import Users from "@/pages/Users";
import { authApi } from "./lib/api";
import { useToast } from "./hooks/use-toast";

// --- Full Screen Loader ---
function FullScreenLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

// --- Placeholder Components for New Pages ---
function Tickets() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Manage Tickets</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

function Bookings() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">View Bookings</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

function Users() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

// --- Component for Public Routes ---
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

// --- Component for Protected Routes ---
function ProtectedRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        {/* <Route path="/users" component={Users} /> */}
        <Route path="/tickets" component={Tickets} /> 
        <Route path="/bookings" component={Bookings} /> 
        <Route path="/users" component={Users} />
        {/* Redirect to Dashboard for root path */}
        
        {/* Redirect login attempts when already logged in */}
        <Route path="/login">
          <Redirect to="/" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

// --- Auth Resolver with API call ---
function AuthResolver() {
    const token = localStorage.getItem("access_token");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    
    const { data: userResponse, isLoading, isError } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
        enabled: !!token,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    // Handle error case first
    React.useEffect(() => {
        if (isError && token) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role");
            setLocation("/login");
        }
    }, [isError, token, setLocation]);

    // If no token, show public routes immediately
    if (!token) {
        return <PublicRoutes />;
    }

    // Show loader only while actually loading
    if (isLoading) {
        return <FullScreenLoader />;
    }

    // Handle error case
    if (isError) {
        return null; // Will redirect via useEffect above
    }

    // Handle successful authentication
    if (userResponse?.data) {
        const user = userResponse.data;
        // Check the nested role name from the /me endpoint
        if (user.role?.name === 'admin') {
            return <ProtectedRoutes />;
        } else {
            // Handle non-admin users
            React.useEffect(() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user_role");
                toast({
                    title: "Access Denied",
                    description: "You do not have permission to access the admin panel.",
                    variant: "destructive",
                });
                setLocation("/login");
            }, []);
            return null;
        }
    }

    // Fallback to public routes if no user data
    return <PublicRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthResolver />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;