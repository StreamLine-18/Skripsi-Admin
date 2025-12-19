import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query';
import { Eye, Ticket, TrendingUp, Users, DollarSign, Search, Filter, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { Link } from "wouter";

export default function Bookings() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [searchField, setSearchField] = useState<string>("leader_name");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  // Get analytics
  const { data: analyticsResponse } = useQuery({
    queryKey: ["bookingAnalytics"],
    queryFn: () => bookingApi.getAnalytics(),
  });

  const analytics = analyticsResponse?.data;

  // Get bookings with filters
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["bookings", page, statusFilter, sourceFilter, searchField, searchValue, isSearching],
    queryFn: () => {
      if (isSearching && searchValue) {
        return bookingApi.searchBookings({
          page,
          pageSize: 10,
          searchField: searchField as any,
          searchValue,
          status: statusFilter || undefined,
          source: sourceFilter as any || undefined,
        });
      }
      return bookingApi.getBookings({
        page,
        pageSize: 10,
        status: statusFilter || undefined,
      });
    },
    placeholderData: keepPreviousData,
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

  const bookings: Booking[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const handleSearch = () => {
    setIsSearching(true);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setIsSearching(false);
    setStatusFilter("");
    setSourceFilter("");
    setPage(1);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Booking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pantau semua transaksi booking
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/qr-scanner">
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          </Link>
          <Link href="/onsite-booking">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Booking On-Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Booking</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {(analytics?.total_bookings || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Ticket className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {formatPrice(analytics?.total_revenue || 0)}
                  </p>
                </div>
                <div className="h-14 w-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Booking Online</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {(analytics?.by_source?.online || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-14 w-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Booking On-Site</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">
                    {(analytics?.by_source?.offline || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-14 w-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Pencarian & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={searchField} onValueChange={setSearchField}>
              <SelectTrigger>
                <SelectValue placeholder="Cari berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leader_name">Nama Pemimpin</SelectItem>
                <SelectItem value="leader_phone">No. Telepon</SelectItem>
                <SelectItem value="id_booking">ID Booking</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Masukkan kata kunci..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <Select value={sourceFilter || "all"} onValueChange={(val) => setSourceFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sumber</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">On-Site</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Success">Berhasil</SelectItem>
                <SelectItem value="Pending">Menunggu</SelectItem>
                <SelectItem value="Used">Terpakai</SelectItem>
                <SelectItem value="Expired">Kadaluarsa</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
              {(searchValue || statusFilter || sourceFilter) && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data booking</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Booking</TableHead>
                    <TableHead>Pemimpin Grup</TableHead>
                    <TableHead>Tanggal Kunjungan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id_booking}>
                      <TableCell>
                        <div className="font-mono text-xs text-gray-600">
                          {booking.id_booking.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{booking.leader_name}</p>
                          <p className="text-sm text-gray-500">{booking.leader_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">
                          {formatDate(booking.visit_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(booking.total_amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={booking.source === 'online' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
                          {booking.source === 'online' ? 'Online' : 'On-Site'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/bookings/${booking.id_booking}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> booking
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.total_pages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
