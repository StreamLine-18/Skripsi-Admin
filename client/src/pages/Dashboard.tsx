import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Ticket, 
  DollarSign, 
  QrCode, 
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { dashboardApi } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedGate, setSelectedGate] = useState<string>("");

  const { data: statsResponse, isLoading } = useQuery({ 
    queryKey: ["dashboardStatistics", selectedMonth, selectedYear, selectedGate], 
    queryFn: () => dashboardApi.getStatistics({ 
      month: selectedMonth, 
      year: selectedYear,
      gate: selectedGate || undefined
    }),
  });
  
  const stats = statsResponse?.data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(price));
  };

  const formatCompactPrice = (price: number) => {
    if (price >= 1000000) {
      return `Rp ${(price / 1000000).toFixed(1)}jt`;
    }
    if (price >= 1000) {
      return `Rp ${(price / 1000).toFixed(0)}k`;
    }
    return formatPrice(price);
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      'Success': 'bg-green-100 text-green-800 border-green-200',
      'Used': 'bg-blue-100 text-blue-800 border-blue-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Expired': 'bg-red-100 text-red-800 border-red-200',
      'Canceled': 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labelMap: Record<string, string> = {
      'Success': 'Berhasil',
      'Used': 'Terpakai',
      'Pending': 'Menunggu',
      'Expired': 'Kadaluarsa',
      'Canceled': 'Dibatalkan',
    };

    return (
      <Badge className={colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labelMap[status] || status}
      </Badge>
    );
  };

  // Chart data
  const revenueChartData = stats?.monthly_revenue?.chart?.map(item => ({
    date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    online: item.online,
    offline: item.offline,
    total: item.online + item.offline
  })) || [];

  const statusData = stats ? Object.entries(stats.booking_status).map(([name, value]) => ({
    name: name === 'Success' ? 'Berhasil' : name === 'Used' ? 'Terpakai' : name === 'Pending' ? 'Menunggu' : name === 'Expired' ? 'Kadaluarsa' : name,
    value
  })) : [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan aktivitas booking dan pendapatan
          </p>
        </div>
        <Link href="/qr-scanner">
          <Button className="bg-green-600 hover:bg-green-700">
            <QrCode className="h-4 w-4 mr-2" />
            Scan Tiket
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats && (
        <>
          {/* Top 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Bookings */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Booking</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {stats.cards.total_bookings.value.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {stats.cards.total_bookings.trend >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${stats.cards.total_bookings.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.cards.total_bookings.trend >= 0 ? '+' : ''}{stats.cards.total_bookings.trend}%
                      </span>
                      <span className="text-xs text-blue-600">7 hari</span>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {formatCompactPrice(stats.cards.total_revenue.value)}
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      {stats.cards.total_revenue.label}
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Current Month */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Pendapatan Bulan Ini</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {formatCompactPrice(stats.cards.revenue_current_month.value)}
                    </p>
                    <p className="text-xs text-purple-600 mt-2 font-medium">
                      {stats.cards.revenue_current_month.label}
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Today */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Booking Hari Ini</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {stats.cards.bookings_today.value}
                    </p>
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      {stats.cards.bookings_today.label}
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Filter Data:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-4 py-2 bg-white rounded-lg min-w-[140px] text-center border">
                      <p className="text-sm font-semibold text-gray-900">
                        {stats.monthly_revenue.month}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMonth}
                      disabled={isCurrentMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-8 w-px bg-gray-300" />
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Gerbang</option>
                    {stats.bookings_by_gate.map((gate) => (
                      <option key={gate.gate} value={gate.gate}>
                        {gate.gate}
                      </option>
                    ))}
                  </select>
                  {selectedGate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGate("")}
                      className="text-gray-600"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Pendapatan Bulanan - Online vs On-Site
                    {selectedGate && <span className="text-blue-600"> ({selectedGate})</span>}
                  </CardTitle>
                  <CardDescription>
                    Grafik pendapatan harian untuk bulan yang dipilih
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => formatCompactPrice(value)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg border shadow-lg">
                            <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.date}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs text-gray-600">Online:</span>
                                <span className="text-xs font-semibold text-gray-900">{formatPrice(payload[0].value as number)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-xs text-gray-600">On-Site:</span>
                                <span className="text-xs font-semibold text-gray-900">{formatPrice(payload[1].value as number)}</span>
                              </div>
                              <div className="pt-1 mt-1 border-t">
                                <span className="text-xs text-gray-600">Total:</span>
                                <span className="text-xs font-bold text-gray-900 ml-2">{formatPrice(payload[0].payload.total)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="online" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#colorOnline)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="offline" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorOffline)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Revenue Summary */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Total Online</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatPrice(stats.monthly_revenue.online)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">Total On-Site</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatPrice(stats.monthly_revenue.offline)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">Total Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatPrice(stats.monthly_revenue.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Gate Bar Chart - Only show when no gate is selected */}
          {!selectedGate && (
            <Card>
              <CardHeader>
                <CardTitle>Pendapatan per Gerbang</CardTitle>
                <CardDescription>Total pendapatan dari setiap gerbang masuk</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.bookings_by_gate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="gate" 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => formatCompactPrice(value)}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg border shadow-lg">
                              <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.gate}</p>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">
                                  Booking: <span className="font-semibold text-gray-900">{payload[0].payload.count}</span>
                                </p>
                                <p className="text-xs text-gray-600">
                                  Revenue: <span className="font-semibold text-green-600">{formatPrice(payload[0].value as number)}</span>
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-sm font-medium text-gray-500">Statistik Tiket</span>
            </div>
          </div>

          {/* Ticket Statistics - Combined */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik Tiket Terjual</CardTitle>
              <CardDescription>Distribusi tiket berdasarkan kategori visitor dan tipe hari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-x divide-gray-200">
                {/* Kategori Visitor */}
                <div className="pr-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Kategori Visitor</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Lokal', value: stats.tickets.by_category.lokal },
                          { name: 'Mancanegara', value: stats.tickets.by_category.mancanegara }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-600">Lokal: <span className="font-semibold">{stats.tickets.by_category.lokal}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-600">Mancanegara: <span className="font-semibold">{stats.tickets.by_category.mancanegara}</span></span>
                    </div>
                  </div>
                </div>

                {/* Tipe Hari */}
                <div className="pl-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Tipe Hari</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Weekday', value: stats.tickets.by_day_type.weekday },
                          { name: 'Weekend', value: stats.tickets.by_day_type.weekend }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-gray-600">Weekday: <span className="font-semibold">{stats.tickets.by_day_type.weekday}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                      <span className="text-sm text-gray-600">Weekend: <span className="font-semibold">{stats.tickets.by_day_type.weekend}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Tiket - Single Display */}
              <div className="mt-6 pt-6 border-t">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 font-medium">Total Tiket Terjual</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.tickets.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Section: Gate Chart + Recent Bookings */}
          <div className={`grid grid-cols-1 gap-6 ${!selectedGate ? 'lg:grid-cols-3' : ''}`}>
            {/* Bookings by Gate Pie Chart - Only show when no gate is selected */}
            {!selectedGate && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking per Gerbang</CardTitle>
                  <CardDescription>Distribusi per gerbang masuk</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.bookings_by_gate.map(item => ({ name: item.gate, value: item.count }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.bookings_by_gate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 rounded-lg border shadow-lg">
                                <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
                                <p className="text-xs text-gray-600">{payload[0].value} booking</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {stats.bookings_by_gate.map((entry, index) => (
                      <div key={entry.gate} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm text-gray-600">{entry.gate}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Bookings */}
            <Card className={!selectedGate ? 'lg:col-span-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking Terbaru</CardTitle>
                    <CardDescription>5 transaksi terakhir</CardDescription>
                  </div>
                  <Link href="/bookings">
                    <Button variant="outline" size="sm">
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recent_bookings.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Belum ada booking</p>
                  ) : (
                    stats.recent_bookings.map((booking) => (
                      <div key={booking.id_booking} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{booking.leader_name}</p>
                            <Badge className={booking.source === 'online' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'}>
                              {booking.source === 'online' ? 'Online' : 'On-Site'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.created_on).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-lg text-gray-900">
                            {formatPrice(booking.total_amount)}
                          </p>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
