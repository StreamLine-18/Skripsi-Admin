import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query';
import { Edit, Trash2, Plus, MapPin, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { destinationApi } from "@/lib/api";
import type { Destination } from "@/lib/api";
import { DestinationForm } from "@/components/forms/DestinationForm";

export default function DestinationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | undefined>();
  const [page, setPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["destinations", page],
    queryFn: () => destinationApi.getAllDestinations({ page, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const destinations: Destination[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => destinationApi.deleteDestination(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast({
        title: "Berhasil",
        description: "Destinasi berhasil dihapus"
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
    mutationFn: (item: Destination) => {
      const currentStatus = item.status || 'Draft';
      const newStatus = currentStatus === "Published" ? "Draft" : "Published";
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('name', item.name);
      formData.append('id_gate', item.id_gate);
      if (item.description) formData.append('description', item.description);
      return destinationApi.updateDestination(item.id_destination, formData);
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      const currentStatus = item.status || 'Draft';
      const newStatus = currentStatus === "Published" ? "dinonaktifkan" : "dipublikasikan";
      toast({
        title: "Berhasil",
        description: `Destinasi berhasil ${newStatus}`
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
    setSelectedDestination(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Destination) => {
    setSelectedDestination(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: Destination) => {
    setSelectedDestination(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDestination) {
      deleteMutation.mutate(selectedDestination.id_destination);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Destinasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola destinasi wisata yang tersedia
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Destinasi
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Destinasi</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {pagination?.total_records || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Destinasi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : destinations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data destinasi</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Destinasi</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Diupdate</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((destination) => (
                    <TableRow key={destination.id_destination}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-rose-600" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{destination.name}</p>
                            <p className="text-xs text-gray-500">
                              Gerbang: {destination.gate?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-600">
                          {destination.slug}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={(destination.status || 'Draft') === 'Published' ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                          {(destination.status || 'Draft') === 'Published' ? 'Dipublikasi' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(destination.updated_on)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate(destination)}
                            title={(destination.status || 'Draft') === 'Published' ? "Nonaktifkan" : "Publikasikan"}
                            className={(destination.status || 'Draft') === 'Published' ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50" : "text-green-600 hover:text-green-900 hover:bg-green-50"}
                          >
                            {(destination.status || 'Draft') === 'Published' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(destination)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            onClick={() => handleDelete(destination)}
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
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> destinasi
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

      <DestinationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        destinationItem={selectedDestination}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus destinasi "{selectedDestination?.name}" secara permanen.
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