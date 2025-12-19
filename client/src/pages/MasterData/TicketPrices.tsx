import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, Ticket as TicketIcon, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ticketPriceApi } from "@/lib/api";
import type { TicketPrice } from "@/lib/api";
import { TicketPriceForm } from "@/components/forms/TicketPriceForm";

export default function TicketPrices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicketPrice, setSelectedTicketPrice] = useState<TicketPrice | undefined>();
  const [page, setPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["ticketPrices", page],
    queryFn: () => ticketPriceApi.getTicketPrices({ page, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const ticketPrices: TicketPrice[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketPriceApi.deleteTicketPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketPrices"] });
      toast({ 
        title: "Berhasil", 
        description: "Harga tiket berhasil dihapus" 
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (ticketPrice: TicketPrice) => 
        ticketPriceApi.updateTicketPrice(ticketPrice.id_ticket_price, { is_active: !ticketPrice.is_active }),
    onSuccess: (_, ticketPrice) => {
        queryClient.invalidateQueries({ queryKey: ["ticketPrices"] });
        toast({ 
          title: "Berhasil", 
          description: `Harga tiket berhasil ${ticketPrice.is_active ? 'dinonaktifkan' : 'diaktifkan'}` 
        });
    },
    onError: (error: any) => {
        toast({ 
          title: "Gagal", 
          description: error.message, 
          variant: "destructive" 
        });
    }
  });

  const handleCreate = () => {
    setSelectedTicketPrice(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (ticketPrice: TicketPrice) => {
    setSelectedTicketPrice(ticketPrice);
    setIsFormOpen(true);
  };

  const handleDelete = (ticketPrice: TicketPrice) => {
    setSelectedTicketPrice(ticketPrice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTicketPrice) {
      deleteMutation.mutate(selectedTicketPrice.id_ticket_price);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Harga Tiket
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola harga tiket berdasarkan gerbang, kategori pengunjung, dan jenis hari
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Harga
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Harga Tiket</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {pagination?.total_records || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TicketIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ticketPrices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data harga tiket</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Detail Tiket</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketPrices.map((tp) => (
                    <TableRow key={tp.id_ticket_price}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{tp.gate?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">
                            {tp.category?.name || 'N/A'} • {tp.dayType?.name || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(tp.price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={tp.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                          {tp.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatusMutation.mutate(tp)}
                            title={tp.is_active ? "Nonaktifkan" : "Aktifkan"}
                            className={tp.is_active ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50" : "text-green-600 hover:text-green-900 hover:bg-green-50"}
                          >
                            {tp.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(tp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900 hover:bg-red-50" 
                            onClick={() => handleDelete(tp)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> harga tiket
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

      <TicketPriceForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        ticketPrice={selectedTicketPrice}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus harga tiket ini secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700" 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
