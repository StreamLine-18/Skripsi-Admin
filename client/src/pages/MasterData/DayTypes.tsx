import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { dayTypeApi } from "@/lib/api";
import type { DayType } from "@/lib/api";
import { DayTypeForm } from "@/components/forms/DayTypeForm";

export default function DayTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDayType, setSelectedDayType] = useState<DayType | undefined>();
  const [page, setPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["dayTypes", page],
    queryFn: () => dayTypeApi.getDayTypes({ page, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const dayTypes: DayType[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dayTypeApi.deleteDayType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dayTypes"] });
      toast({ 
        title: "Berhasil", 
        description: "Jenis hari berhasil dihapus" 
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

  const handleCreate = () => {
    setSelectedDayType(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (dayType: DayType) => {
    setSelectedDayType(dayType);
    setIsFormOpen(true);
  };

  const handleDelete = (dayType: DayType) => {
    setSelectedDayType(dayType);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDayType) {
      deleteMutation.mutate(selectedDayType.id_day_type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Jenis Hari
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola jenis hari untuk penetapan harga tiket (contoh: Hari Biasa, Akhir Pekan)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jenis Hari
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jenis Hari</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {pagination?.total_records || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jenis Hari</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : dayTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data jenis hari</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Jenis Hari</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayTypes.map((dayType) => (
                    <TableRow key={dayType.id_day_type}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <CalendarDays className="h-5 w-5 text-amber-600" />
                          </div>
                          <span className="ml-3 font-medium text-gray-900">
                            {dayType.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {dayType.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(dayType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900 hover:bg-red-50" 
                            onClick={() => handleDelete(dayType)}
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
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> jenis hari
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

      <DayTypeForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        dayType={selectedDayType}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus jenis hari "{selectedDayType?.name}" secara permanen.
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
