import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "@/components/layout/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Banner from "@/pages/Banner";
import Login from "@/pages/Login";
import ProductsCategory from "@/pages/ProductsCategory";
import NotFound from "@/pages/not-found";
import Events from "@/pages/Events";
import TeamManagement from "@/pages/Teams";
import TeamMembers from "./pages/TeamMember";
import HealthCheck from "./pages/HealthCheck";
import Product from "./pages/Product";
import EventGuestBooks from "./pages/EventGuestBooks";
import AttendanceList from "./pages/GuestBookAttendanceList";
import EventFullAttendance from "./pages/EventFullAttendance";
import Users from "./pages/Users";
import Badges from "./pages/BadgeType";
import UserBadges from "./pages/UserBadges";
import FitalkParticipants from "./pages/FitalkParticipants";
import FitalkAttendance from "./pages/FitalkAttendance";
import Leaderboard from "./pages/Leaderboard";
import { authApi } from "./lib/api";
import { useToast } from "./hooks/use-toast";

function FullScreenLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

// --- Component for Public Routes ---
// This now only contains routes that are strictly for unauthenticated users.
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/leaderboard/:id_event" component={Leaderboard} />
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

// --- Component for Protected Routes ---
// This remains the same, containing all routes that need the AdminLayout.
function ProtectedRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/users" component={Users} />
        <Route path="/users/:id_user/badges" component={UserBadges} />
        <Route path="/products-category" component={ProductsCategory} />
        <Route path="/events" component={Events} />
        <Route path="/events/:id_event/guest-books" component={EventGuestBooks} />
        <Route path="/events/:id_event/guest-books/:id_guest_book/attendances" component={AttendanceList} />
        <Route path="/events/:id_event/attendances" component={EventFullAttendance} />
        <Route path="/banner" component={Banner} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/team-members/:teamId" component={TeamMembers} />
        <Route path="/products" component={Product} />
        <Route path="/health-check" component={HealthCheck} />
        <Route path="/badge-type" component={Badges} />
        <Route path="/fitalk/participants" component={FitalkParticipants} />
        <Route path="/fitalk/attendances" component={FitalkAttendance} />
        <Route path="/login">
          <Redirect to="/" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

// This component now only handles the logic for authenticated vs. unauthenticated routes.
function AuthResolver() {
    const token = localStorage.getItem("access_token");
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const { data: userResponse, isLoading, isError } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
        enabled: !!token,
        retry: false,
    });

    if (isLoading && token) {
        return <FullScreenLoader />;
    }

    if (isError) {
        localStorage.removeItem("access_token");
        setLocation("/login");
        return null;
    }

    if (userResponse?.data) {
        const user = userResponse.data;
        if (user.role === 'admin') {
            return <ProtectedRoutes />;
        } else {
            localStorage.removeItem("access_token");
            toast({
                title: "Access Denied",
                description: "You do not have permission to access the admin panel.",
                variant: "destructive",
            });
            setLocation("/login");
            return null;
        }
    }

    return <PublicRoutes />;
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* UPDATED: The main router now handles the public leaderboard route first */}
        <Switch>
          {/* This route is now outside the AuthResolver, so it won't have the admin layout */}
          <Route path="/leaderboard/:id_event" component={Leaderboard} />
          
          {/* All other routes are handled by the AuthResolver */}
          <Route>
            <AuthResolver />
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
