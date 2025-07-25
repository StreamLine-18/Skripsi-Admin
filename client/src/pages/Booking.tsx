import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { Link } from "wouter";

export default function Bookings() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["bookings", currentPage],
    queryFn: () => bookingApi.getBookings({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const bookings: Booking[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const columns = [
    {
      key: "id",
      label: "Booking ID",
      render: (booking: Booking) => (
        <div className="font-mono text-sm">{booking.id_booking}</div>
      ),
    },
    {
      key: "visitor",
      label: "Visitor",
      render: (booking: Booking) => (
        <div className="text-sm font-medium text-slate-900">{booking.user?.full_name || 'N/A'}</div>
      ),
    },
    {
      key: "amount",
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
        if (booking.status === 'success') colorClass = "bg-emerald-100 text-emerald-800";
        if (booking.status === 'pending') colorClass = "bg-amber-100 text-amber-800";
        if (booking.status === 'cancel' || booking.status === 'expired' || booking.status === 'deny') colorClass = "bg-red-100 text-red-800";
        
        return <Badge className={colorClass}>{booking.status}</Badge>;
      }
    },
    {
      key: "date",
      label: "Date",
      render: (booking: Booking) => new Date(booking.created_on).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
  ];

  const actions = (booking: Booking) => (
    <Link href={`/bookings/${booking.id_booking}`}>
      <Button variant="ghost" size="sm">
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>
    </Link>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            All Bookings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A list of all bookings made in the system.
          </p>
        </div>
      </div>

      <DataTable
        title="Booking History"
        description="Browse and review all booking transactions."
        data={bookings.map(b => ({ ...b, id: b.id_booking }))}
        columns={columns}
        loading={isLoading}
        actions={actions}
      />

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
            disabled={pagination.page === pagination.total_pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
