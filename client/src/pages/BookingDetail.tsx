import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { BookingDetailCard } from "@/components/ui/BookingDetailCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/bookings/:id");
  const bookingId = params?.id || "";

  // State for the redeem confirmation dialog
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [selectedBookingDetailId, setSelectedBookingDetailId] = useState<string | null>(null);

  const { data: bookingResponse, isLoading, isError, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId,
    retry: false,
  });

  const booking: Booking | null = bookingResponse?.data || null;

  const redeemMutation = useMutation({
    mutationFn: (bookingDetailId: string) => bookingApi.redeemBooking(bookingDetailId),
    onSuccess: () => {
        toast({ title: "Success", description: "Ticket redeemed successfully!" });
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
        setIsRedeemDialogOpen(false);
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message || "Failed to redeem ticket.", variant: "destructive" });
        setIsRedeemDialogOpen(false);
    }
  });

  const handleRedeemClick = (bookingDetailId: string) => {
    setSelectedBookingDetailId(bookingDetailId);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = () => {
    if (selectedBookingDetailId) {
      redeemMutation.mutate(selectedBookingDetailId);
    }
  };

  return (
    <div className="p-4 md:p-6">
       <div className="mb-4">
        <Link href="/bookings">
            <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Bookings
            </Button>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        {isLoading && (
            <div>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
            </div>
        )}
        {isError && (
             <div className="text-center py-10 px-4 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-semibold text-red-800">Error Fetching Booking</h3>
                <p className="mt-1 text-sm text-red-600">{error.message}</p>
             </div>
        )}
        {booking && !isLoading && (
            <BookingDetailCard 
                booking={booking} 
                onRedeemClick={handleRedeemClick} 
            />
        )}
      </div>

      {/* Redeem Confirmation Dialog */}
      <AlertDialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to redeem this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? "Redeeming..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
