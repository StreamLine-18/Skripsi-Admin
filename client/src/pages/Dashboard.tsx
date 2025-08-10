import { useQuery } from "@tanstack/react-query";
import { Users, Ticket, ClipboardList, DollarSign, QrCode, ArrowUp, ArrowDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    dashboardApi,
} from "@/lib/api";
import type { Booking } from "@/lib/api";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

// --- New Stats Card Component ---
interface DetailedStatsCardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
    description: string;
}

function DetailedStatsCard({ title, value, change, changeType, description }: DetailedStatsCardProps) {
    const isIncrease = changeType === 'increase';
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-4xl">{value}</CardTitle>
            </CardHeader>
            <CardContent>
                {/* <div className={cn("text-xs flex items-center", isIncrease ? "text-emerald-500" : "text-red-500")}>
                    {isIncrease ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                    {change}
                </div> */}
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}


export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // --- Use single query to fetch all dashboard data ---
  const { data: dashboardResponse, isLoading } = useQuery({ 
    queryKey: ["dashboardSummary"], 
    queryFn: dashboardApi.getSummary,
  });
  
  const dashboardData = dashboardResponse?.data;

  // --- Process data for stats and charts ---
  const { stats, salesData, recentBookings } = useMemo(() => {
    if (!dashboardData) {
        return {
            stats: { totalRevenue: 'Rp 0', totalVisitors: '0', totalBookings: '0', totalTicketPrices: '0' },
            salesData: [],
            recentBookings: []
        };
    }

    const calculatedStats = {
      totalRevenue: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dashboardData.stats.totalRevenue),
      totalVisitors: dashboardData.stats.totalVisitors.toLocaleString(),
      totalBookings: dashboardData.stats.totalBookings.toLocaleString(),
      totalTicketPrices: dashboardData.stats.totalTicketPrices.toLocaleString(),
    };

    const rawChartData = timeRange === 7 ? dashboardData.charts.salesLast7Days : dashboardData.charts.salesLast30Days;
    
    // Format chart data for display
    const calculatedSalesData = rawChartData
        .map(item => ({
            name: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            total: item.total,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());


    return { stats: calculatedStats, salesData: calculatedSalesData, recentBookings: dashboardData.recentBookings };
  }, [dashboardData, timeRange]);

  const bookingColumns = [
    {
      key: "visitor",
      label: "Visitor",
      render: (booking: Booking) => (
        <div className="flex flex-col">
          <span className="font-medium">{booking.user?.full_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground font-mono">{booking.id_booking.split('-')[0]}</span>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (booking: Booking) => (
        <div className="text-sm font-semibold">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(booking.total_amount))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (booking: Booking) => {
        let colorClass = "bg-slate-100 text-slate-800";
        if (booking.status === 'success' || booking.status === 'Success') colorClass = "bg-emerald-100 text-emerald-800";
        if (booking.status === 'pending') colorClass = "bg-amber-100 text-amber-800";
        if (booking.status === 'Failure' || booking.status === 'Expired') colorClass = "bg-red-100 text-red-800";
        
        return <Badge className={cn("capitalize", colorClass)}>{booking.status}</Badge>;
      }
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back! Here's a summary of your ticketing activity.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/qr-scanner"><Button><QrCode className="h-4 w-4 mr-2" />Scan Ticket</Button></Link>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailedStatsCard title="Total Revenue" value={stats.totalRevenue} change="+12.5%" changeType="increase" description="" />
            <DetailedStatsCard title="Total Visitors" value={stats.totalVisitors} change="-20%" changeType="decrease" description="" />
            <DetailedStatsCard title="Total Bookings" value={stats.totalBookings} change="+5.5%" changeType="increase" description="" />
            <DetailedStatsCard title="Ticket Prices" value={stats.totalTicketPrices} change="+2" changeType="increase" description="" />
        </div>
      )}

      <div className="flex flex-col gap-6 mt-8">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Total Visitors</CardTitle>
                        <CardDescription>Total revenue for the last {timeRange} days.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <Button variant={timeRange === 30 ? "default" : "outline"} size="sm" onClick={() => setTimeRange(30)}>Last 30 days</Button>
                        <Button variant={timeRange === 7 ? "default" : "outline"} size="sm" onClick={() => setTimeRange(7)}>Last 7 days</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={salesData}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${Number(value) / 1000}k`} />
                        <Tooltip 
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <span className="font-bold text-foreground">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payload[0].value as number)}
                                            </span>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#colorTotal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>The five most recent bookings made.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    title="Recent Bookings"
                    data={recentBookings.map(booking => ({ ...booking, id: booking.id_booking}))}
                    columns={bookingColumns}
                    loading={isLoading}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
