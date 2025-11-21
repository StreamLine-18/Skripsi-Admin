import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Camera, Image as ImageIcon, CheckCircle, RefreshCw, User, Phone, Calendar, Ticket, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function QrScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [scannedBookingId, setScannedBookingId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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
    onSuccess: () => {
      toast({ 
        title: "Berhasil!", 
        description: "Tiket berhasil ditukarkan. Pengunjung dapat masuk.",
        duration: 3000,
      });
      
      setTimeout(() => {
        if (scannedBookingId) {
          setLocation(`/bookings/${scannedBookingId}`);
        }
      }, 1000);
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
      
      toast({ 
        title, 
        description: errorMessage, 
        variant: "destructive" 
      });
      resetScanner();
    },
    onSettled: () => {
      setIsConfirmModalOpen(false);
    }
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


  // --- Scanner Setup and Handlers ---
  useEffect(() => {
    if (mode === "camera" && cameras.length === 0) {
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length) setCameras(devices);
          else {
             toast({ 
               title: "Error Kamera", 
               description: "Tidak ada kamera ditemukan pada perangkat ini.", 
               variant: "destructive" 
             });
             setMode("idle");
          }
        })
        .catch(err => {
          console.error("Failed to get cameras", err);
          toast({ 
            title: "Error Kamera", 
            description: "Tidak dapat mengakses kamera. Periksa izin akses.", 
            variant: "destructive" 
          });
          setMode("idle");
        });
    }
  }, [mode, cameras.length, toast]);

  const onScanSuccess = (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      scannerRef.current = null;
    }
    setMode("idle");
    setScannedBookingId(decodedText);
    setIsConfirmModalOpen(true);
  };

  const startCameraScan = (cameraId: string) => {
    setCameras([]); 
    const qrScanner = new Html5Qrcode("qr-reader");
    scannerRef.current = qrScanner;
    qrScanner.start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {}
    ).catch(err => {
        toast({ 
          title: "Error Scanner", 
          description: "Gagal memulai scanner kamera.", 
          variant: "destructive" 
        });
        setMode("idle");
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tempReaderElement = document.createElement('div');
    tempReaderElement.id = 'temp-qr-reader';
    tempReaderElement.style.display = 'none';
    document.body.appendChild(tempReaderElement);

    const qrScanner = new Html5Qrcode("temp-qr-reader");
    qrScanner.scanFile(file, true)
      .then(onScanSuccess)
      .catch(() => toast({ 
        title: "Scan Gagal", 
        description: "Tidak ada QR code ditemukan pada gambar.", 
        variant: "destructive" 
      }))
      .finally(() => document.body.removeChild(tempReaderElement));
  };
  
  const resetScanner = () => {
    setMode("idle");
    setScannedBookingId(null);
    setCameras([]);
    setIsConfirmModalOpen(false);
  }

  const handleConfirmRedeem = () => {
    if (scannedBookingId) {
      redeemMutation.mutate(scannedBookingId);
    }
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
    };

    const labelMap: Record<string, string> = {
      'Valid': 'Valid',
      'Success': 'Berhasil',
      'Used': 'Terpakai',
      'Pending': 'Menunggu',
      'Expired': 'Kadaluarsa',
    };

    return (
      <Badge className={colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labelMap[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <style>{`
        #qr-reader { border: none; }
        #qr-reader video { border-radius: 0.5rem; border: 1px solid hsl(var(--border)); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Scanner QR Code
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Scan QR code tiket untuk verifikasi dan penukaran
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Scanner Tiket</CardTitle>
            <CardDescription>
              {mode === "idle" && "Pilih metode scanning"}
              {mode === "camera" && cameras.length > 0 && "Pilih kamera untuk memulai"}
              {mode === "camera" && cameras.length === 0 && "Meminta akses kamera..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "idle" && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-4 w-full">
                  <Button onClick={() => setMode("camera")} className="w-full bg-green-600 hover:bg-green-700">
                    <Camera className="mr-2 h-4 w-4"/>
                    Scan dengan Kamera
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                    <ImageIcon className="mr-2 h-4 w-4"/>
                    Upload Gambar QR
                  </Button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            )}
            {mode === "camera" && (
              <div>
                <div id="qr-reader" style={{ width: "100%" }}></div>
                {cameras.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-center">Kamera Tersedia:</p>
                    {cameras.map(cam => (
                      <Button key={cam.id} onClick={() => startCameraScan(cam.id)} variant="outline" className="w-full justify-start">
                        <Camera className="mr-2 h-4 w-4"/>
                        {cam.label || `Kamera ${cam.id.substring(0, 6)}`}
                      </Button>
                    ))}
                     <Button onClick={resetScanner} variant="ghost" className="w-full text-muted-foreground">
                       <RefreshCw className="mr-2 h-4 w-4"/>
                       Reset
                     </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal with Booking Details */}
      <Dialog open={isConfirmModalOpen} onOpenChange={(open) => {
        if (!open) resetScanner();
        setIsConfirmModalOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verifikasi Tiket</DialogTitle>
            <DialogDescription>
              Periksa detail booking sebelum menukarkan tiket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Booking ID */}
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Booking</p>
              <p className="font-mono bg-gray-100 p-2 rounded-md text-xs break-all">{scannedBookingId}</p>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  {getStatusBadge(booking)}
                </div>

                {/* Leader Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Nama Pemimpin</p>
                      <p className="font-medium text-gray-900">{booking.leader_name}</p>
                    </div>
                  </div>
                  {booking.leader_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">No. Telepon</p>
                        <p className="font-medium text-gray-900">{booking.leader_phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Kunjungan</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(booking.visit_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Daftar Tiket</p>
                  </div>
                  <div className="space-y-2">
                    {booking.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.gate_name}</p>
                          <p className="text-xs text-gray-600">{item.category_name} • {item.day_type_name}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.quantity} tiket × {formatPrice(item.price)}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-green-600">{formatPrice(booking.total_amount)}</span>
                </div>

                {/* Warning for already used */}
                {booking.used_at && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Tiket Sudah Digunakan</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Ditukar pada: {new Date(booking.used_at).toLocaleString('id-ID', {
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
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetScanner}>
              Batal
            </Button>
            <Button 
              onClick={handleConfirmRedeem} 
              disabled={redeemMutation.isPending || isLoadingBooking || !!bookingError || !booking || !!booking.used_at}
              className="bg-green-600 hover:bg-green-700"
            >
              {redeemMutation.isPending ? (
                "Menukar..."
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
