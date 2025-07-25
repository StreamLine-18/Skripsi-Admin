import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Camera, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { bookingApi } from "@/lib/api";
import type { BookingDetail } from "@/lib/api";

export default function QrScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Redemption Logic ---
  const redeemMutation = useMutation<{data: BookingDetail}, Error, string>({
    mutationFn: async (bookingDetailId: string) => {
      const response = await bookingApi.redeemBooking(bookingDetailId);
      return response as {data: BookingDetail};
    },
    onSuccess: (response) => {
      const redeemedDetail: BookingDetail = response.data;
      const parentBookingId = redeemedDetail.id_booking;

      toast({ title: "Success!", description: "Ticket has been successfully redeemed." });
      
      // Invalidate queries to ensure data is fresh if the user navigates back
      queryClient.invalidateQueries({ queryKey: ["booking", parentBookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });

      // Redirect to the parent booking's detail page
      setTimeout(() => {
        setLocation(`/bookings/${parentBookingId}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast({ title: "Redemption Failed", description: error.message, variant: "destructive" });
      resetScanner();
    },
    onSettled: () => {
      setIsConfirmModalOpen(false);
    }
  });

  // --- Scanner Setup and Handlers ---
  useEffect(() => {
    if (mode === "camera" && cameras.length === 0) {
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length) setCameras(devices);
          else {
             toast({ title: "Camera Error", description: "No cameras found on this device.", variant: "destructive" });
             setMode("idle");
          }
        })
        .catch(err => {
          console.error("Failed to get cameras", err);
          toast({ title: "Camera Error", description: "Could not access cameras. Please check permissions.", variant: "destructive" });
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
    setScanResult(decodedText);
    setIsConfirmModalOpen(true); // Show confirmation modal instead of redirecting
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
        toast({ title: "Scanner Error", description: "Failed to start the camera scanner.", variant: "destructive" });
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
      .catch(() => toast({ title: "Scan Failed", description: "No QR code found in the selected image.", variant: "destructive" }))
      .finally(() => document.body.removeChild(tempReaderElement));
  };
  
  const resetScanner = () => {
    setMode("idle");
    setScanResult(null);
    setCameras([]);
    setIsConfirmModalOpen(false);
  }

  const handleConfirmRedeem = () => {
    if (scanResult) {
      redeemMutation.mutate(scanResult);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <style>{`
        #qr-reader { border: none; }
        #qr-reader video { border-radius: 0.5rem; border: 1px solid hsl(var(--border)); }
      `}</style>

      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Scan or Upload QR Code</h2>
          <p className="mt-1 text-sm text-slate-500">Choose to scan live or upload an image of a QR code.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button></Link>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Scanner</CardTitle>
            <CardDescription>
              {mode === "idle" && "Select a scanning method."}
              {mode === "camera" && cameras.length > 0 && "Select a camera to begin."}
              {mode === "camera" && cameras.length === 0 && "Requesting camera access..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "idle" && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Button onClick={() => setMode("camera")}><Camera className="mr-2 h-4 w-4"/>Scan with Camera</Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary"><ImageIcon className="mr-2 h-4 w-4"/>Upload Image</Button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            )}
            {mode === "camera" && (
              <div>
                <div id="qr-reader" style={{ width: "100%" }}></div>
                {cameras.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-center">Available Cameras:</p>
                    {cameras.map(cam => (
                      <Button key={cam.id} onClick={() => startCameraScan(cam.id)} variant="outline" className="w-full justify-start">
                        <Camera className="mr-2 h-4 w-4"/>
                        {cam.label || `Camera ${cam.id.substring(0, 6)}`}
                      </Button>
                    ))}
                     <Button onClick={resetScanner} variant="ghost" className="w-full text-muted-foreground"><RefreshCw className="mr-2 h-4 w-4"/>Reset</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Ticket Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Ticket ID</p>
            <p className="font-mono bg-slate-100 p-2 rounded-md text-sm">{scanResult}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={resetScanner}>Cancel</Button>
            <Button onClick={handleConfirmRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? "Redeeming..." : "Confirm & Redeem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
