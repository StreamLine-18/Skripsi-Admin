import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, AlertTriangle, User, Phone, Calendar, MapPin, CreditCard, QrCode, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/bookings/:id");
  const bookingId = params?.id || "";

  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);

  const { data: bookingResponse, isLoading, isError, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId,
    retry: false,
  });

  const booking: Booking | null = bookingResponse?.data || null;

  const redeemMutation = useMutation({
    mutationFn: (id_booking: string) => bookingApi.redeemBooking(id_booking),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Booking berhasil ditukarkan!"
      });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      setIsRedeemDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Gagal menukarkan booking.";
      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive"
      });
      setIsRedeemDialogOpen(false);
    }
  });

  const handleRedeemClick = () => {
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = () => {
    if (bookingId) {
      redeemMutation.mutate(bookingId);
    }
  };

  const formatDate = (dateStr: string | number | Date | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(price));
  };

  const getStatusBadge = (booking: Booking) => {
    const status = booking.computed_status || booking.status;
    const colorMap: Record<string, string> = {
      'Valid': 'bg-green-100 text-green-800 border-green-200',
      'Success': 'bg-green-100 text-green-800 border-green-200',
      'Used': 'bg-blue-100 text-blue-800 border-blue-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Expired': 'bg-red-100 text-red-800 border-red-200',
      'Canceled': 'bg-gray-100 text-gray-800 border-gray-200',
      'Denied': 'bg-red-100 text-red-800 border-red-200',
    };

    const labelMap: Record<string, string> = {
      'Valid': 'Valid',
      'Success': 'Berhasil',
      'Used': 'Terpakai',
      'Pending': 'Menunggu',
      'Expired': 'Kadaluarsa',
      'Canceled': 'Dibatalkan',
      'Denied': 'Ditolak',
    };

    return (
      <Badge className={colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labelMap[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Booking
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-semibold text-red-800">Error Memuat Booking</h3>
              <p className="mt-1 text-sm text-red-600">{(error as Error)?.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {booking && !isLoading && (
        <>
          {/* Booking Info Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                  <CardTitle>Detail Booking</CardTitle>
                  <CardDescription className="font-mono mt-1 text-xs">
                    {booking.id_booking}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(booking)}
                  <Badge className={booking.source === 'online' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
                    {booking.source === 'online' ? 'Online' : 'On-Site'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Leader Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Pemimpin Grup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Nama</p>
                      <p className="font-medium text-gray-900">{booking.leader_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">No. Telepon</p>
                      <p className="font-medium text-gray-900">{booking.leader_phone}</p>
                    </div>
                  </div>
                  {booking.leader_gender && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Jenis Kelamin</p>
                        <p className="font-medium text-gray-900">{booking.leader_gender}</p>
                      </div>
                    </div>
                  )}
                  {booking.leader_nationality && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Kewarganegaraan</p>
                        <p className="font-medium text-gray-900">{booking.leader_nationality}</p>
                      </div>
                    </div>
                  )}
                  {booking.leader_id_type && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Jenis Identitas</p>
                        <p className="font-medium text-gray-900">{booking.leader_id_type}: {booking.leader_id_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visit Information */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Kunjungan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Kunjungan</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(booking.visit_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Dibuat Pada</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.created_on).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {booking.paid_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Dibayar Pada</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.paid_at).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.used_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Ditukar Pada</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.used_at).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Info */}
              {booking.user && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Dibuat Oleh</h3>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.user.full_name}</p>
                      <p className="text-sm text-gray-500">{booking.user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets Card */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Tiket</CardTitle>
              <CardDescription>
                Total: {formatPrice(booking.total_amount)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.details && booking.details.length > 0 ? (
                  booking.details.map((detail, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-900">{detail.gate_name}</p>
                        <p className="text-sm text-gray-600">
                          {detail.category_name} • {detail.day_type_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {detail.quantity} tiket × {formatPrice(detail.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(detail.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Tidak ada data tiket</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          {booking.qr_code && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Scan QR code ini untuk menukarkan booking
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <img
                  src={booking.qr_code}
                  alt="QR Code"
                  className="w-64 h-64 border rounded-lg"
                />
                {booking.status === 'Success' && !booking.used_at && (
                  <Button
                    onClick={handleRedeemClick}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Tukar Booking
                  </Button>
                )}
                {booking.used_at && (
                  <Badge className="mt-4 bg-blue-100 text-blue-800 border-blue-200">
                    Sudah Ditukar
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Redeem Confirmation Dialog */}
      <AlertDialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penukaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menukarkan booking ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRedeem}
              disabled={redeemMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {redeemMutation.isPending ? "Menukar..." : "Konfirmasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
