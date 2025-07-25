import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, QrCode, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { BookingDetailCard } from "@/components/ui/BookingDetailCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchId, setSearchId] = useState("");
  const [bookingId, setBookingId] = useState("");

  const { data: bookingResponse, isLoading, isError, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId, // Only run query if bookingId is set
    retry: false,
  });

  const booking: Booking | null = bookingResponse?.data || null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setBookingId(searchId.trim());
    }
  };

  const redeemMutation = useMutation({
    mutationFn: (bookingDetailId: string) => bookingApi.redeemBooking(bookingDetailId),
    onSuccess: () => {
        toast({ title: "Success", description: "Ticket redeemed successfully!" });
        // Refetch the booking details to update the status
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message || "Failed to redeem ticket.", variant: "destructive" });
    }
  });

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Booking Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search for a booking by its ID to view details and redeem tickets.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
            <Input 
                type="text" 
                placeholder="Enter Booking ID..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-grow"
            />
            <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
            </Button>
            <Button type="button" variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
            </Button>
        </form>

        <div className="mt-6">
            {isLoading && (
                <div>
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                </div>
            )}
            {isError && (
                 <div className="text-center py-10 px-4 rounded-lg bg-red-50 border border-red-200">
                    <h3 className="text-lg font-semibold text-red-800">Booking Not Found</h3>
                    <p className="text-sm text-red-600 mt-1">{error.message}</p>
                 </div>
            )}
            {booking && !isLoading && (
                <BookingDetailCard booking={booking} onRedeem={redeemMutation.mutate} isRedeeming={redeemMutation.isPending} />
            )}
            {!bookingId && !isLoading && (
                <div className="text-center py-10 px-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Ticket className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-semibold text-slate-800">Find a Booking</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Enter a booking ID above to get started.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
