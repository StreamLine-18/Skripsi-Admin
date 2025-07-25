import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Booking, BookingDetail } from "@/lib/api";
import { User, Calendar, TicketCheck, Ticket } from "lucide-react";

interface BookingDetailCardProps {
    booking: Booking;
    onRedeem: (bookingDetailId: string) => void;
    isRedeeming: boolean;
}

export function BookingDetailCard({ booking, onRedeem, isRedeeming }: BookingDetailCardProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            case 'expired':
                return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Booking Details</CardTitle>
                        <CardDescription className="font-mono mt-1">{booking.id_booking}</CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                </div>
                <div className="text-sm text-muted-foreground pt-2 space-y-2">
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
                        <div key={detail.id_booking_detail} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                            <div>
                                <p className="font-semibold">{detail.ticketPrice.gate.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {detail.ticketPrice.category.name} - {detail.ticketPrice.dayType.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono pt-1">
                                    ID: {detail.id_booking_detail.split('-')[0]}
                                </p>
                            </div>
                            <div>
                                {detail.used_at ? (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                                        <TicketCheck className="w-4 h-4 mr-2"/>
                                        Redeemed
                                    </Badge>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        onClick={() => onRedeem(detail.id_booking_detail)}
                                        disabled={isRedeeming || booking.status !== 'paid'}
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
