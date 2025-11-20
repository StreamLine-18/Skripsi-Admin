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
import Users from "@/pages/Users";
import DayTypes from "@/pages/DayTypes"; 
import VisitorCategories from "@/pages/VisitorCategories";
import TicketPrices from "./pages/TicketPrices";
import Bookings from "@/pages/Booking";
import BookingDetail from "@/pages/BookingDetail";
import QrScanner from "./pages/QrScanner";
import Gates from "@/pages/Gates";
import OnsiteBooking from "./pages/OnsiteBooking";
import NewsPage from "./pages/News";
import EventsPage from "./pages/Event";
import DestinationsPage from "./pages/Destinations";
import SKMPage from "./pages/SKM";
import PengaduanPage from "./pages/Pengaduan";
import WBSPage from "./pages/WBS";
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




// --- Component for Public Routes ---
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route><Redirect to="/login" /></Route>
    </Switch>
  );
}

// --- Component for Protected Routes ---
function ProtectedRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/bookings" component={Bookings} /> 
        <Route path="/users" component={Users} />
        <Route path="/ticket-prices" component={TicketPrices} /> 
        <Route path="/day-types" component={DayTypes} /> 
        <Route path="/gates" component={Gates} /> 
        <Route path="/qr-scanner" component={QrScanner} />
        <Route path="/bookings/:id" component={BookingDetail} />
        <Route path="/visitor-categories" component={VisitorCategories} /> 
        <Route path="/onsite-booking" component={OnsiteBooking} />
        <Route path="/news" component={NewsPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/destinations" component={DestinationsPage} />
        <Route path="/skm" component={SKMPage} />
        <Route path="/pengaduan" component={PengaduanPage} />
        <Route path="/wbs" component={WBSPage} />
        <Route path="/login"><Redirect to="/" /></Route>
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
    const [isLoaderVisible, setIsLoaderVisible] = React.useState(true);

    const { data: userResponse, isLoading, isError } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
        enabled: !!token,
        retry: false,
    });

    React.useEffect(() => {
        if (token) {
            setIsLoaderVisible(true);
            const timer = setTimeout(() => setIsLoaderVisible(false), 500);
            return () => clearTimeout(timer);
        } else {
            setIsLoaderVisible(false);
        }
    }, [token]);

    if (token && (isLoading || isLoaderVisible)) {
        return <FullScreenLoader />;
    }

    if (isError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        setLocation("/login");
        return null;
    }

    if (userResponse?.data) {
        const user = userResponse.data;
        if (user.role?.name === 'admin') {
            return <ProtectedRoutes />;
        } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role");
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
        <AuthResolver />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
