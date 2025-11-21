import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { gateApi, dayTypeApi, ticketPriceApi, bookingApi } from "@/lib/api";
import type { Gate, DayType, TicketPrice } from "@/lib/api";
import { PlusCircle, MinusCircle, X, ShoppingCart, Loader2, Ticket, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

type CartItem = TicketPrice & { quantity: number };

export default function OnsiteBooking() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Optional customer name
  const [customerName, setCustomerName] = useState("");

  // Ticket selection
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [selectedDayType, setSelectedDayType] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- Data Fetching ---
  const { data: gatesResponse } = useQuery({ 
    queryKey: ["gates", "all"], 
    queryFn: () => gateApi.getGates({ pageSize: 999 }) 
  });
  
  const { data: dayTypesResponse } = useQuery({ 
    queryKey: ["dayTypes", "all"], 
    queryFn: () => dayTypeApi.getDayTypes({ pageSize: 999 }) 
  });
  
  const { data: ticketPricesResponse, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["ticketPrices", selectedGate, selectedDayType],
    queryFn: () => ticketPriceApi.getTicketPrices({ 
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

  // --- Auto-select Day Type based on the current day ---
  useEffect(() => {
    if (dayTypes.length > 0 && !selectedDayType) {
      const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = today === 0 || today === 6;
      
      const defaultDayType = dayTypes.find(dt => 
        isWeekend 
          ? dt.name.toLowerCase().includes('weekend') || dt.name.toLowerCase().includes('akhir pekan')
          : dt.name.toLowerCase().includes('weekday') || dt.name.toLowerCase().includes('hari kerja')
      );
      
      if (defaultDayType) {
        setSelectedDayType(defaultDayType.id_day_type);
      }
    }
  }, [dayTypes, selectedDayType]);

  // --- State Handlers ---
  const handleGateChange = (gateId: string) => {
    setSelectedGate(gateId);
    setCart([]);
  };

  const handleDayTypeChange = (dayTypeId: string) => {
    setSelectedDayType(dayTypeId);
    setCart([]);
  };

  // --- Cart Logic ---
  const addToCart = (ticket: TicketPrice) => {
    setCart(prev => {
        const existing = prev.find(item => item.id_ticket_price === ticket.id_ticket_price);
        if (existing) {
            return prev.map(item => item.id_ticket_price === ticket.id_ticket_price ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...ticket, quantity: 1 }];
    });
  };
  
  const removeFromCart = (ticketId: string) => {
    setCart(prev => prev.filter(item => item.id_ticket_price !== ticketId));
  };
  
  const updateQuantity = (ticketId: string, quantity: number) => {
    if (quantity <= 0) {
        removeFromCart(ticketId);
    } else {
        setCart(prev => prev.map(item => item.id_ticket_price === ticketId ? { ...item, quantity } : item));
    }
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(price));
  };

  // --- Booking Creation ---
  const createBookingMutation = useMutation({
    mutationFn: bookingApi.createOnsiteBooking,
    onSuccess: (response) => {
        toast({ 
          title: "Berhasil!", 
          description: "Booking on-site berhasil dibuat. Pengunjung dapat langsung masuk.",
          duration: 3000,
        });
        setLocation(`/bookings/${response.data.id_booking}`);
    },
    onError: (error: any) => {
        toast({ 
          title: "Gagal Membuat Booking", 
          description: error.message, 
          variant: "destructive" 
        });
    }
  });

  const handleCreateBooking = () => {
    if (cart.length === 0) {
      toast({ 
        title: "Keranjang Kosong", 
        description: "Silakan tambahkan minimal satu tiket.", 
        variant: "destructive" 
      });
      return;
    }

    // Build payload with visit_date
    const today = new Date().toISOString().split('T')[0];
    
    const payload: any = {
      ticketOrders: cart.map(item => ({ 
        id_ticket_price: item.id_ticket_price, 
        quantity: item.quantity 
      })),
      leader: {
        visit_date: today
      }
    };

    // Add optional name if provided
    if (customerName.trim()) {
      payload.leader.name = customerName.trim();
    }

    createBookingMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Booking On-Site (Kasir)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Penjualan tiket langsung untuk pengunjung walk-in
          </p>
        </div>
        <Link href="/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Left Column: Ticket Selection --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Optional Customer Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nama Pengunjung (Opsional)</CardTitle>
              <CardDescription>Kosongkan jika pengunjung tidak ingin memberikan nama</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder='Opsional'
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-base"
              />
            </CardContent>
          </Card>

          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Tiket</CardTitle>
              <CardDescription>Pilih gerbang dan jenis hari untuk melihat tiket yang tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Gerbang Masuk</Label>
                  <Select value={selectedGate} onValueChange={handleGateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih gerbang" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {gates.map(gate => (
                        <SelectItem key={gate.id_gate} value={gate.id_gate}>
                          {gate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Hari</Label>
                  <Select value={selectedDayType} onValueChange={handleDayTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis hari" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {dayTypes.map(dt => (
                        <SelectItem key={dt.id_day_type} value={dt.id_day_type}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[400px] mt-4 pr-4">
                <div className="space-y-3">
                  {isLoadingPrices && (
                    <div className="text-center p-4 text-gray-500 flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat tiket...
                    </div>
                  )}
                  {!isLoadingPrices && !selectedGate && (
                    <div className="text-center p-4 text-gray-500">Silakan pilih gerbang masuk.</div>
                  )}
                  {!isLoadingPrices && selectedGate && !selectedDayType && (
                    <div className="text-center p-4 text-gray-500">Silakan pilih jenis hari.</div>
                  )}
                  {!isLoadingPrices && availableTickets.length === 0 && selectedGate && selectedDayType && (
                    <div className="text-center p-4 text-gray-500">Tidak ada tiket aktif untuk pilihan ini.</div>
                  )}
                  {availableTickets.map(ticket => (
                    <div key={ticket.id_ticket_price} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Ticket className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{ticket.category.name}</p>
                          <p className="text-sm text-gray-600">{formatPrice(ticket.price)}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(ticket)} className="bg-green-600 hover:bg-green-700">
                        <PlusCircle className="h-4 w-4 mr-2" /> Tambah
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column: Cart Summary --- */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Ringkasan Pembelian</CardTitle>
              <CardDescription>Tinjau pesanan sebelum checkout</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">Keranjang kosong</p>
                  <p className="text-xs mt-1">Tambahkan tiket untuk memulai</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.id_ticket_price} className="flex items-start justify-between border-b pb-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{item.category.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatPrice(item.price)} / tiket</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => updateQuantity(item.id_ticket_price, item.quantity - 1)}
                              >
                                <MinusCircle className="h-4 w-4"/>
                              </Button>
                              <span className="text-base font-semibold w-10 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => updateQuantity(item.id_ticket_price, item.quantity + 1)}
                              >
                                <PlusCircle className="h-4 w-4"/>
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => removeFromCart(item.id_ticket_price)}
                            >
                              <X className="h-4 w-4"/>
                            </Button>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Total Tiket:</span>
                      <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)} tiket</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-xl">
                      <span>Total Bayar:</span>
                      <span className="text-green-600">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </>
              )}
              
              <Separator className="my-6" />

              <Button 
                onClick={handleCreateBooking} 
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
                    Checkout & Cetak Tiket
                  </>
                )}
              </Button>

              {cart.length > 0 && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Pengunjung dapat langsung masuk setelah checkout
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
