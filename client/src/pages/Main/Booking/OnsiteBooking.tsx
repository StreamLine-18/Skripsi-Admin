import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { gateApi, dayTypeApi, ticketPriceApi, bookingApi } from "@/lib/api";
import type { Gate, DayType, TicketPrice } from "@/lib/api";
import { Plus, Minus, Trash2, ShoppingCart, Loader2, Ticket, ArrowLeft, CheckCircle, Store, User, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";
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

// Config for holiday API
const HOLIDAY_API = import.meta.env.VITE_HOLIDAY_API || "";

// Helper function to check if a date is a national holiday
async function checkIsHoliday(dateStr: string): Promise<boolean> {
  // First try external API if available
  if (HOLIDAY_API) {
    try {
      const res = await fetch(HOLIDAY_API);
      const holidays = await res.json();
      return holidays.some((h: any) => h.holiday_date === dateStr && h.is_national_holiday);
    } catch {
      // Fallback to offline check if API fails
    }
  }

  // Offline holiday check (Indonesian fixed holidays)
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const year = d.getFullYear();
  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const iso = fmt(d);

  // Fixed-date national holidays (common ones)
  const fixed = new Set([
    `${year}-01-01`, // New Year's Day
    `${year}-05-01`, // Labour Day
    `${year}-06-01`, // Pancasila Day
    `${year}-08-17`, // Independence Day
    `${year}-12-25`, // Christmas
  ]);

  // Compute Easter Sunday (Meeus/Jones algorithm) and Good Friday
  const easterSunday = (y: number) => {
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d1 = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d1 - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  };

  const es = easterSunday(year);
  const goodFriday = new Date(es);
  goodFriday.setDate(es.getDate() - 2);
  const gfIso = fmt(goodFriday);

  if (fixed.has(iso)) return true;
  if (iso === gfIso) return true;

  return false;
}

// Helper function to detect day type based on date and holiday status
function detectDayType(date: Date, isHoliday: boolean): "Weekend" | "Weekday" {
  const day = date.getDay();
  if (day === 0 || day === 6 || isHoliday) return "Weekend";
  return "Weekday";
}

type CartItem = TicketPrice & { quantity: number };

export default function OnsiteBooking() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [customerName, setCustomerName] = useState("");
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [selectedDayType, setSelectedDayType] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoadingDayType, setIsLoadingDayType] = useState(true);

  const { data: gatesResponse } = useQuery({
    queryKey: ["gates", "all"],
    queryFn: () => gateApi.getGates({ pageSize: 999 }),
  });

  const { data: dayTypesResponse } = useQuery({
    queryKey: ["dayTypes", "all"],
    queryFn: () => dayTypeApi.getDayTypes({ pageSize: 999 }),
  });

  const { data: ticketPricesResponse, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["ticketPrices", selectedGate, selectedDayType],
    queryFn: () =>
      ticketPriceApi.getTicketPrices({
        pageSize: 999,
        id_gate: selectedGate,
        id_day_type: selectedDayType,
        is_active: true,
      }),
    enabled: !!selectedGate && !!selectedDayType,
  });

  const gates: Gate[] = gatesResponse?.data || [];
  const dayTypes: DayType[] = dayTypesResponse?.data || [];
  const availableTickets: TicketPrice[] = ticketPricesResponse?.data || [];

  // Auto-detect day type based on today's date and holiday status
  useEffect(() => {
    if (dayTypes.length === 0 || selectedDayType) return;

    const autoDetectDayType = async () => {
      setIsLoadingDayType(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Check if today is a national holiday
        const isHoliday = await checkIsHoliday(todayStr);
        const detectedType = detectDayType(today, isHoliday);

        // Find matching day type from backend
        const matchedDayType = dayTypes.find(dt => {
          const name = dt.name.toLowerCase();
          if (detectedType === "Weekend") {
            return name.includes("weekend") || name.includes("akhir pekan") || name.includes("libur");
          } else {
            return name.includes("weekday") || name.includes("kerja") || name.includes("biasa");
          }
        });

        if (matchedDayType) {
          setSelectedDayType(matchedDayType.id_day_type);
        }
      } catch (error) {
        console.error("Error detecting day type:", error);
        // Fallback to simple weekend check
        const today = new Date().getDay();
        const isWeekend = today === 0 || today === 6;
        const defaultDayType = dayTypes.find((dt) =>
          isWeekend
            ? dt.name.toLowerCase().includes("weekend") || dt.name.toLowerCase().includes("libur")
            : dt.name.toLowerCase().includes("weekday") || dt.name.toLowerCase().includes("kerja")
        );
        if (defaultDayType) setSelectedDayType(defaultDayType.id_day_type);
      } finally {
        setIsLoadingDayType(false);
      }
    };

    autoDetectDayType();
  }, [dayTypes, selectedDayType]);

  useEffect(() => {
    if (gates.length > 0 && !selectedGate) {
      setSelectedGate(gates[0].id_gate);
    }
  }, [gates, selectedGate]);

  const handleGateChange = (gateId: string) => {
    setSelectedGate(gateId);
    setCart([]);
  };

  const handleDayTypeChange = (dayTypeId: string) => {
    setSelectedDayType(dayTypeId);
    setCart([]);
  };

  const addToCart = (ticket: TicketPrice) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id_ticket_price === ticket.id_ticket_price);
      if (existing) {
        return prev.map((item) =>
          item.id_ticket_price === ticket.id_ticket_price ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...ticket, quantity: 1 }];
    });
  };

  const removeFromCart = (ticketId: string) => {
    setCart((prev) => prev.filter((item) => item.id_ticket_price !== ticketId));
  };

  const updateQuantity = (ticketId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(ticketId);
    } else {
      setCart((prev) => prev.map((item) => (item.id_ticket_price === ticketId ? { ...item, quantity } : item)));
    }
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const totalTickets = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const createBookingMutation = useMutation({
    mutationFn: bookingApi.createOnsiteBooking,
    onSuccess: (response) => {
      toast({
        title: "Berhasil!",
        description: "Booking berhasil. Pengunjung dapat langsung masuk.",
        duration: 3000,
      });
      setLocation(`/bookings/${response.data.id_booking}`);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenConfirmModal = () => {
    if (cart.length === 0) {
      toast({ title: "Keranjang Kosong", description: "Tambahkan minimal satu tiket.", variant: "destructive" });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = () => {
    const payload: any = {
      ticketOrders: cart.map((item) => ({ id_ticket_price: item.id_ticket_price, quantity: item.quantity })),
    };
    if (customerName.trim()) payload.leaderName = customerName.trim();
    createBookingMutation.mutate(payload);
    setShowConfirmModal(false);
  };

  const selectedGateName = gates.find((g) => g.id_gate === selectedGate)?.name || "";
  const selectedDayTypeName = dayTypes.find((d) => d.id_day_type === selectedDayType)?.name || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Store className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking On-Site</h1>
            <p className="text-sm text-gray-500">Penjualan tiket langsung untuk pengunjung</p>
          </div>
        </div>
        <Link href="/bookings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Tanggal</p>
                <p className="text-sm font-semibold text-blue-900">
                  {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Gerbang</p>
                <p className="text-sm font-semibold text-green-900">{selectedGateName || "Belum dipilih"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-purple-600 font-medium">Jenis Hari</p>
                  {!isLoadingDayType && selectedDayTypeName && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-200/50 text-purple-700 border-purple-300">
                      Otomatis
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-purple-900">
                  {isLoadingDayType ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Mendeteksi...
                    </span>
                  ) : (
                    selectedDayTypeName || "Belum dipilih"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gate & Day Type Selection - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Pilih Gerbang Masuk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {gates.map((gate) => (
                <Button
                  key={gate.id_gate}
                  variant="outline"
                  onClick={() => handleGateChange(gate.id_gate)}
                  className={`h-14 text-base font-medium ${selectedGate === gate.id_gate
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 ring-2 ring-blue-300"
                    : "text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                >
                  {gate.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Pilih Jenis Hari
            </CardTitle>
            <CardDescription className="text-xs">
              Otomatis terdeteksi berdasarkan hari ini (termasuk cek tanggal merah). Klik untuk mengubah manual jika diperlukan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDayType ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="h-14 bg-purple-100 animate-pulse rounded-lg"></div>
                <div className="h-14 bg-purple-100 animate-pulse rounded-lg"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {dayTypes.map((dt) => (
                  <Button
                    key={dt.id_day_type}
                    variant="outline"
                    onClick={() => handleDayTypeChange(dt.id_day_type)}
                    className={`h-14 text-base font-medium ${selectedDayType === dt.id_day_type
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 ring-2 ring-purple-300"
                      : "text-gray-800 hover:bg-purple-50 hover:border-purple-300"
                      }`}
                  >
                    {dt.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <Input
                  placeholder="Nama pengunjung (opsional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="border-0 bg-transparent text-base font-medium placeholder:text-gray-400 focus-visible:ring-0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pilih Tiket</CardTitle>
              <CardDescription>Klik untuk menambahkan ke keranjang</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPrices ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Memuat tiket...
                </div>
              ) : !selectedGate || !selectedDayType ? (
                <div className="text-center py-12 text-gray-400">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Pilih gerbang dan jenis hari</p>
                </div>
              ) : availableTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada tiket tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableTickets.map((ticket) => {
                    const inCart = cart.find((c) => c.id_ticket_price === ticket.id_ticket_price);
                    return (
                      <div
                        key={ticket.id_ticket_price}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${inCart ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                          }`}
                        onClick={() => addToCart(ticket)}
                      >
                        {inCart && <Badge className="absolute -top-2 -right-2 bg-green-600">{inCart.quantity}</Badge>}
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${inCart ? "bg-green-200" : "bg-gray-100"}`}>
                            <Ticket className={`h-6 w-6 ${inCart ? "text-green-700" : "text-gray-600"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{ticket.category.name}</p>
                            <p className="text-lg font-bold text-green-600">{formatPrice(ticket.price)}</p>
                          </div>
                          <Plus className={`h-6 w-6 ${inCart ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6 border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6" />
                <div>
                  <CardTitle className="text-white">Keranjang</CardTitle>
                  <CardDescription className="text-green-100">{totalTickets} tiket dipilih</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Keranjang kosong</p>
                  <p className="text-sm mt-1">Pilih tiket untuk memulai</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id_ticket_price} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.category.name}</p>
                          <p className="text-xs text-gray-500">{formatPrice(item.price)} / tiket</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1"
                          onClick={() => removeFromCart(item.id_ticket_price)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white rounded-lg border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => updateQuantity(item.id_ticket_price, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => updateQuantity(item.id_ticket_price, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-bold text-green-600">{formatPrice(Number(item.price) * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total Bayar</span>
                      <span className="text-2xl font-bold text-green-600">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleOpenConfirmModal}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
                disabled={createBookingMutation.isPending || cart.length === 0}
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Proses Pembayaran
                  </>
                )}
              </Button>
              {cart.length > 0 && <p className="text-xs text-center text-gray-500 mt-3">Tiket langsung aktif setelah checkout</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Konfirmasi Booking
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Pastikan data booking sudah benar sebelum melanjutkan:</p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {customerName.trim() && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Nama:</span>
                      <span className="text-sm font-medium text-gray-900">{customerName.trim()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Gerbang:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedGateName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Jenis Hari:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedDayTypeName}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Detail Tiket:</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {cart.map((item) => (
                      <div key={item.id_ticket_price} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.category.name} x {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total ({totalTickets} tiket)</span>
                      <span className="text-lg font-bold text-green-600">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBooking}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Konfirmasi & Proses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
