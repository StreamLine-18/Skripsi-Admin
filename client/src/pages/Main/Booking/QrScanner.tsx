import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  RefreshCw,
  User,
  Calendar,
  Ticket,
  AlertCircle,
  QrCode,
  ScanLine,
  XCircle,
  Clock
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function QrScanner() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "camera" | "scanning">("idle");
  const [scannedBookingId, setScannedBookingId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<{ id: string; name: string; status: string; time: Date }[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch booking details after scanning
  const { data: bookingResponse, isLoading: isLoadingBooking, error: bookingError } = useQuery({
    queryKey: ["booking", scannedBookingId],
    queryFn: () => bookingApi.getBookingById(scannedBookingId!),
    enabled: !!scannedBookingId && isConfirmModalOpen,
    retry: false,
  });

  const booking: Booking | null = bookingResponse?.data || null;

  // --- Redemption Logic ---
  const redeemMutation = useMutation({
    mutationFn: (id_booking: string) => bookingApi.redeemBooking(id_booking),
    onSuccess: (_, id_booking) => {
      toast({
        title: "Berhasil!",
        description: "Tiket berhasil ditukarkan. Pengunjung dapat masuk.",
        duration: 3000,
      });

      // Add to recent scans
      if (booking) {
        setRecentScans((prev) => [
          { id: id_booking, name: booking.leader_name || "Unknown", status: "success", time: new Date() },
          ...prev.slice(0, 4),
        ]);
      }

      setTimeout(() => {
        resetScanner();
      }, 1500);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Gagal menukarkan tiket";
      const errorCode = error.error_code;

      let title = "Gagal Menukar Tiket";
      if (errorCode === "ALREADY_REDEEMED") {
        title = "Tiket Sudah Digunakan";
      } else if (errorCode === "NOT_PAID") {
        title = "Belum Dibayar";
      } else if (errorCode === "EXPIRED") {
        title = "Tiket Kadaluarsa";
      }

      // Add to recent scans as failed
      if (booking) {
        setRecentScans((prev) => [
          { id: scannedBookingId!, name: booking.leader_name || "Unknown", status: "failed", time: new Date() },
          ...prev.slice(0, 4),
        ]);
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      });
      resetScanner();
    },
    onSettled: () => {
      setIsConfirmModalOpen(false);
    },
  });

  const formatDate = (dateStr: string | number | Date | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isVisitDateToday = (visitDate: string | null | undefined): boolean => {
    if (!visitDate) return false;
    const today = new Date();
    const visit = new Date(visitDate);
    return (
      today.getFullYear() === visit.getFullYear() &&
      today.getMonth() === visit.getMonth() &&
      today.getDate() === visit.getDate()
    );
  };

  const getTodayDateFormatted = () => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Scanner Setup and Handlers ---
  useEffect(() => {
    if (mode === "camera" && cameras.length === 0) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) setCameras(devices);
          else {
            toast({
              title: "Error Kamera",
              description: "Tidak ada kamera ditemukan pada perangkat ini.",
              variant: "destructive",
            });
            setMode("idle");
          }
        })
        .catch(() => {
          toast({
            title: "Error Kamera",
            description: "Tidak dapat mengakses kamera. Periksa izin akses.",
            variant: "destructive",
          });
          setMode("idle");
        });
    }
  }, [mode, cameras.length, toast]);

  const onScanSuccess = (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => { });
      scannerRef.current = null;
    }
    setMode("idle");
    setScannedBookingId(decodedText);
    setIsConfirmModalOpen(true);
  };

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const startCameraScan = (cameraId: string) => {
    setCameras([]);
    setSelectedCameraId(cameraId);
    setMode("scanning");
  };

  // Start scanner after the qr-reader div is rendered
  useEffect(() => {
    if (mode === "scanning" && selectedCameraId && !scannerRef.current) {
      const qrScanner = new Html5Qrcode("qr-reader");
      scannerRef.current = qrScanner;
      qrScanner
        .start(selectedCameraId, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => { })
        .catch(() => {
          toast({
            title: "Error Scanner",
            description: "Gagal memulai scanner kamera.",
            variant: "destructive",
          });
          setMode("idle");
          setSelectedCameraId(null);
        });
    }
  }, [mode, selectedCameraId, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tempReaderElement = document.createElement("div");
    tempReaderElement.id = "temp-qr-reader";
    tempReaderElement.style.display = "none";
    document.body.appendChild(tempReaderElement);

    const qrScanner = new Html5Qrcode("temp-qr-reader");
    qrScanner
      .scanFile(file, true)
      .then(onScanSuccess)
      .catch(() =>
        toast({
          title: "Scan Gagal",
          description: "Tidak ada QR code ditemukan pada gambar.",
          variant: "destructive",
        })
      )
      .finally(() => document.body.removeChild(tempReaderElement));
  };

  const resetScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => { });
      scannerRef.current = null;
    }
    setMode("idle");
    setScannedBookingId(null);
    setCameras([]);
    setSelectedCameraId(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmRedeem = () => {
    if (scannedBookingId) {
      redeemMutation.mutate(scannedBookingId);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const getStatusBadge = (booking: Booking) => {
    const status = booking.computed_status || booking.status;
    const colorMap: Record<string, string> = {
      Valid: "bg-green-100 text-green-800 border-green-200",
      Success: "bg-green-100 text-green-800 border-green-200",
      Used: "bg-blue-100 text-blue-800 border-blue-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Expired: "bg-red-100 text-red-800 border-red-200",
    };

    const labelMap: Record<string, string> = {
      Valid: "Valid",
      Success: "Berhasil",
      Used: "Terpakai",
      Pending: "Menunggu",
      Expired: "Kadaluarsa",
    };

    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {labelMap[status] || status}
      </Badge>
    );
  };

  const isDateValid = booking ? isVisitDateToday(booking.visit_date) : false;
  const canRedeem = booking && !isLoadingBooking && !bookingError && !booking.used_at &&
    (booking.computed_status === "Valid" || booking.status === "Success") && isDateValid;

  return (
    <div className="space-y-6">
      <style>{`
        #qr-reader { border: none; }
        #qr-reader video { border-radius: 0.75rem; }
        #qr-reader__scan_region { background: transparent !important; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scanner QR Code</h1>
          <p className="text-sm text-gray-500 mt-1">Scan QR code tiket untuk verifikasi dan penukaran</p>
        </div>
        <Link href="/bookings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Scanner Tiket</CardTitle>
                  <CardDescription className="text-blue-100">
                    {mode === "idle" && "Pilih metode untuk memulai scanning"}
                    {mode === "camera" && cameras.length > 0 && "Pilih kamera yang tersedia"}
                    {mode === "camera" && cameras.length === 0 && "Meminta akses kamera..."}
                    {mode === "scanning" && "Arahkan kamera ke QR code tiket"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {mode === "idle" && (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <ScanLine className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Siap untuk Scan</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">
                    Gunakan kamera untuk scan langsung atau upload gambar QR code
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button
                      onClick={() => setMode("camera")}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Buka Kamera
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      <ImageIcon className="mr-2 h-5 w-5" />
                      Upload Gambar
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {mode === "camera" && cameras.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">Pilih Kamera:</p>
                    <div className="space-y-2">
                      {cameras.map((cam) => (
                        <Button
                          key={cam.id}
                          onClick={() => startCameraScan(cam.id)}
                          variant="outline"
                          className="w-full justify-start h-12 bg-white hover:bg-blue-50"
                        >
                          <Camera className="mr-3 h-5 w-5 text-blue-600" />
                          <span className="truncate">{cam.label || `Kamera ${cam.id.substring(0, 8)}`}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={resetScanner} variant="ghost" className="w-full text-gray-500">
                    <XCircle className="mr-2 h-4 w-4" />
                    Batal
                  </Button>
                </div>
              )}

              {mode === "scanning" && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <div id="qr-reader" style={{ width: "100%" }}></div>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border-[3px] border-white/30 rounded-xl"></div>
                    </div>
                  </div>
                  <Button onClick={resetScanner} variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Berhenti & Reset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-gray-400" />
                Scan Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Belum ada scan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan, index) => (
                    <div
                      key={`${scan.id}-${index}`}
                      className={`p-3 rounded-lg border ${scan.status === "success"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {scan.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium text-sm text-gray-900">{scan.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(scan.time)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono truncate">{scan.id.substring(0, 16)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/bookings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Ticket className="mr-2 h-4 w-4" />
                  Lihat Semua Booking
                </Button>
              </Link>
              <Link href="/onsite-booking" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Booking On-Site Baru
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal with Booking Details */}
      <Dialog
        open={isConfirmModalOpen}
        onOpenChange={(open) => {
          if (!open) resetScanner();
          setIsConfirmModalOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Verifikasi Tiket
            </DialogTitle>
            <DialogDescription>Periksa detail booking sebelum menukarkan tiket</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Booking ID */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">ID Booking</p>
              <p className="font-mono text-sm break-all text-gray-900">{scannedBookingId}</p>
            </div>

            {/* Loading State */}
            {isLoadingBooking && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {/* Error State */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Booking Tidak Ditemukan</p>
                  <p className="text-sm text-red-700 mt-1">
                    {(bookingError as Error).message || "QR code tidak valid atau booking tidak ada."}
                  </p>
                </div>
              </div>
            )}

            {/* Booking Details */}
            {booking && !isLoadingBooking && (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Status Tiket</span>
                  {getStatusBadge(booking)}
                </div>

                {/* Leader Info */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{booking.leader_name}</p>
                      {booking.leader_phone && (
                        <p className="text-sm text-gray-500">{booking.leader_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                    <Calendar className="h-4 w-4" />
                    <span>Kunjungan: {formatDate(booking.visit_date)}</span>
                  </div>
                </div>

                {/* Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">
                      Daftar Tiket ({booking.details?.length || 0})
                    </p>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {booking.details?.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{detail.gate_name}</p>
                          <p className="text-xs text-gray-500">
                            {detail.category_name} • {detail.day_type_name} • {detail.quantity}x
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(detail.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-semibold text-gray-900">Total Pembayaran</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(booking.total_amount)}
                  </span>
                </div>

                {/* Warning for wrong date */}
                {!isDateValid && !booking.used_at && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Tanggal Kunjungan Tidak Sesuai</p>
                      <p className="text-sm text-red-700 mt-1">
                        Tiket ini untuk tanggal <strong>{formatDate(booking.visit_date)}</strong>,
                        sedangkan hari ini adalah <strong>{getTodayDateFormatted()}</strong>.
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Tiket hanya dapat ditukar pada tanggal kunjungan yang sesuai.
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning for already used */}
                {booking.used_at && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Tiket Sudah Digunakan</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Ditukar pada:{" "}
                        {new Date(booking.used_at).toLocaleString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetScanner}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmRedeem}
              disabled={redeemMutation.isPending || !canRedeem}
              className="bg-green-600 hover:bg-green-700"
            >
              {redeemMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Konfirmasi & Tukar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
