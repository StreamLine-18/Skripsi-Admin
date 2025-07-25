import { useQuery } from "@tanstack/react-query";
import { Users, Ticket, ClipboardList, DollarSign, QrCode } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { 
    userApi,
    ticketPriceApi,
    bookingApi,
} from "@/lib/api";
import type { User, TicketPrice, Booking } from "@/lib/api";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {

  // --- Fetch all necessary data in parallel for the dashboard ---
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["users", "all"], 
    queryFn: () => userApi.getUsers({ pageSize: 9999 })
  });
  const { data: ticketPricesResponse, isLoading: isLoadingTicketPrices } = useQuery({ 
    queryKey: ["ticketPrices", "all"], 
    queryFn: () => ticketPriceApi.getTicketPrices({ pageSize: 9999 }) 
  });
  const { data: bookingsResponse, isLoading: isLoadingBookings } = useQuery({ 
    queryKey: ["bookings", "all"], 
    queryFn: () => bookingApi.getBookings({ pageSize: 9999 }) 
  });

  // --- Calculate Stats ---
  const stats = useMemo(() => {
    const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
    const ticketPrices = Array.isArray(ticketPricesResponse?.data) ? ticketPricesResponse.data : [];
    const bookings = Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : [];
    
    const totalRevenue = bookings
      .filter(b => b.status === 'paid')
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

    return {
      totalVisitors: users.filter(u => u.role?.name === 'visitor').length,
      totalTicketPrices: ticketPrices.length,
      totalBookings: bookings.length,
      totalRevenue: totalRevenue,
    };
  }, [usersResponse, ticketPricesResponse, bookingsResponse]);

  // --- Prepare data for recent bookings table ---
  const recentBookings = useMemo(() => {
    const bookings = Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : [];
    return bookings
      .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())
      .slice(0, 5);
  }, [bookingsResponse]);

  const bookingColumns = [
    {
      key: "id_booking",
      label: "Booking ID",
       render: (booking: Booking) => (
        <div className="font-mono text-xs">{booking.id_booking.split('-')[0]}...</div>
      )
    },
    {
      key: "visitor",
      label: "Visitor",
      render: (booking: Booking) => (
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-900">{booking.user?.full_name || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (booking: Booking) => (
        <div className="text-sm">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(booking.total_amount))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (booking: Booking) => {
        let colorClass = "bg-slate-100 text-slate-800";
        if (booking.status === 'paid') colorClass = "bg-emerald-100 text-emerald-800";
        if (booking.status === 'pending') colorClass = "bg-amber-100 text-amber-800";
        if (booking.status === 'cancelled' || booking.status === 'expired') colorClass = "bg-red-100 text-red-800";
        
        return <Badge className={colorClass}>{booking.status}</Badge>;
      }
    },
    {
        key: "created_on",
        label: "Date",
        render: (booking: Booking) => new Date(booking.created_on).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  ];
  
  const isLoading = isLoadingUsers || isLoadingTicketPrices || isLoadingBookings;

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here's a summary of your ticketing activity.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/qr-scanner">
                <Button>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan Ticket
                </Button>
            </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Visitors" value={stats.totalVisitors} icon={Users} iconColor="bg-blue-500" />
          <StatsCard title="Ticket Prices" value={stats.totalTicketPrices} icon={Ticket} iconColor="bg-purple-500" />
          <StatsCard title="Total Bookings" value={stats.totalBookings} icon={ClipboardList} iconColor="bg-amber-500" />
          <StatsCard title="Total Revenue" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.totalRevenue)} icon={DollarSign} iconColor="bg-emerald-500" />
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="mt-8">
        <DataTable
          title="Recent Bookings"
          description="A list of the most recent booking transactions."
          data={recentBookings.map(booking => ({ ...booking, id: booking.id_booking}))}
          columns={bookingColumns}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
