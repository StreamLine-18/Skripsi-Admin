import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { gateApi, dayTypeApi, ticketPriceApi, bookingApi } from "@/lib/api";
import type { Gate, DayType, TicketPrice } from "@/lib/api";
import { PlusCircle, MinusCircle, X, ShoppingCart, Loader2 } from "lucide-react";

type CartItem = TicketPrice & { quantity: number };

export default function OnsiteBooking() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
          ? dt.name.toLowerCase().includes('weekend') 
          : dt.name.toLowerCase().includes('weekday')
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

  // --- Booking Creation ---
  const createBookingMutation = useMutation({
    mutationFn: bookingApi.createOnsiteBooking,
    onSuccess: (response) => {
        toast({ title: "Success!", description: "Onsite booking created successfully."});
        setLocation(`/bookings/${response.data.id_booking}`);
    },
    onError: (error: any) => {
        toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateBooking = () => {
    if (cart.length === 0) {
        toast({ title: "Empty Cart", description: "Please add at least one ticket.", variant: "destructive" });
        return;
    }
    createBookingMutation.mutate({
        ticketOrders: cart.map(item => ({ id_ticket_price: item.id_ticket_price, quantity: item.quantity })),
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Onsite Booking (Point of Sale)</h2>
          <p className="mt-1 text-sm text-slate-500">Create a new booking for visitors purchasing tickets in person.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* --- Ticket Selection --- */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Select Tickets</CardTitle>
                    <CardDescription>First, choose a gate and day type to see available tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <Select value={selectedGate} onValueChange={handleGateChange}>
                            <SelectTrigger><SelectValue placeholder="Select an Entrance Gate" /></SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {gates.map(gate => (
                                    <SelectItem key={gate.id_gate} value={gate.id_gate}>
                                        {gate.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedDayType} onValueChange={handleDayTypeChange}>
                            <SelectTrigger><SelectValue placeholder="Select a Day Type" /></SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {dayTypes.map(dt => (
                                    <SelectItem key={dt.id_day_type} value={dt.id_day_type}>
                                        {dt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <ScrollArea className="h-[400px] mt-4 pr-4">
                      <div key={`${selectedGate}-${selectedDayType}`} className="space-y-3">
                          {isLoadingPrices && (
                            <div className="text-center p-4 text-muted-foreground flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tickets...
                            </div>
                          )}
                          {!isLoadingPrices && !selectedGate && (
                            <div className="text-center p-4 text-muted-foreground">Please select an entrance gate.</div>
                          )}
                           {!isLoadingPrices && selectedGate && !selectedDayType && (
                            <div className="text-center p-4 text-muted-foreground">Please select a day type.</div>
                          )}
                          {!isLoadingPrices && availableTickets.length === 0 && selectedGate && selectedDayType && (
                              <div className="text-center p-4 text-muted-foreground">No active tickets found for this selection.</div>
                          )}
                          {availableTickets.map(ticket => (
                              <div key={ticket.id_ticket_price} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border hover:bg-slate-100 transition-colors">
                                  <div>
                                      <p className="font-semibold">{ticket.category.name}</p>
                                      <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(ticket.price))}</p>
                                  </div>
                                  <Button size="sm" onClick={() => addToCart(ticket)}>
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add
                                  </Button>
                              </div>
                          ))}
                      </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        {/* --- Cart and Visitor Details --- */}
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                    <CardDescription>Review the order before creating the booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    {cart.length === 0 ? (
                        <div className="text-center p-6 text-muted-foreground">
                            <ShoppingCart className="mx-auto h-8 w-8" />
                            <p className="mt-2 text-sm">Your cart is empty</p>
                        </div>
                    ) : (
                      <>
                        <ScrollArea className="h-[250px] pr-4">
                          <div className="space-y-4">
                              {cart.map(item => (
                                  <div key={item.id_ticket_price} className="flex items-start justify-between">
                                      <div>
                                          <p className="font-medium text-sm">{item.category.name}</p>
                                          <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(item.price))}</p>
                                          <div className="flex items-center gap-2 mt-2">
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id_ticket_price, item.quantity - 1)}><MinusCircle className="h-4 w-4"/></Button>
                                              <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id_ticket_price, item.quantity + 1)}><PlusCircle className="h-4 w-4"/></Button>
                                          </div>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.id_ticket_price)}><X className="h-4 w-4"/></Button>
                                  </div>
                              ))}
                          </div>
                        </ScrollArea>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}</span>
                        </div>
                      </>
                    )}
                    
                    <Separator className="my-6" />

                    <Button onClick={handleCreateBooking} className="w-full" disabled={createBookingMutation.isPending || cart.length === 0}>
                        {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Booking
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
