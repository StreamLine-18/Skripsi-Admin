import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Booking } from "@/lib/api";
import { userApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { User, Calendar, TicketCheck, Ticket, UserCog } from "lucide-react";

// --- New component to fetch and display the admin's name ---
function RedeemedByInfo({ adminId }: { adminId: string }) {
    const { data: adminResponse } = useQuery({
        queryKey: ['user', adminId],
        queryFn: () => userApi.getUserById(adminId),
        enabled: !!adminId,
    });

    const adminName = adminResponse?.data?.full_name || 'Loading...';

    return (
        <div className="flex items-center text-sm text-muted-foreground mt-1">
            <UserCog className="w-4 h-4 mr-2" />
            <span>Redeemed by: {adminName}</span>
        </div>
    );
}


interface BookingDetailCardProps {
    booking: Booking;
    onRedeemClick: (bookingDetailId: string) => void;
}

export function BookingDetailCard({ booking, onRedeemClick }: BookingDetailCardProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Success':
                return <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>;
            case 'Pending':
                return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
            case 'Failure':
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            case 'Expired':
                return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div>
                        <CardTitle>Booking Details</CardTitle>
                        <CardDescription className="font-mono mt-1">{booking.id_booking}</CardDescription>
                    </div>
                    <div className="mt-2 sm:mt-0">
                        {getStatusBadge(booking.status)}
                    </div>
                </div>
                <div className="text-sm text-muted-foreground pt-4 space-y-2">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>{booking.user.full_name}</span>
                    </div>
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Booked on {new Date(booking.created_on).toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-md font-semibold mb-3">Tickets</h3>
                <div className="space-y-3">
                    {booking.bookingDetails.map((detail) => (
                        <div key={detail.id_booking_detail} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-slate-50 border gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{detail.ticketPrice.gate?.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {detail.ticketPrice.category?.name || 'N/A'} - {detail.ticketPrice.dayType?.name || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono pt-1">
                                    ID: {detail.id_booking_detail.split('-')[0]}
                                </p>
                                {/* Conditionally render the RedeemedByInfo component */}
                                {detail.used_by && <RedeemedByInfo adminId={detail.used_by} />}
                            </div>
                            <div className="w-full sm:w-auto flex-shrink-0">
                                {detail.used_at ? (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 w-full justify-center py-2 text-xs">
                                        <TicketCheck className="w-4 h-4 mr-2"/>
                                        Redeemed: {new Date(detail.used_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Badge>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        onClick={() => onRedeemClick(detail.id_booking_detail)}
                                        disabled={booking.status !== 'Success'}
                                        className="w-full"
                                    >
                                        <Ticket className="w-4 h-4 mr-2"/>
                                        Redeem Ticket
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
