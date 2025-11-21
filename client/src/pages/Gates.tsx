import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, DoorOpen, Power, PowerOff } from "lucide-react";
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
import { gateApi } from "@/lib/api";
import type { Gate } from "@/lib/api";
import { GateForm } from "@/components/forms/GatesForm";

export default function Gates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | undefined>();
  const [page, setPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["gates", page],
    queryFn: () => gateApi.getGates({ page, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const gates: Gate[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gateApi.deleteGate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gates"] });
      toast({ 
        title: "Berhasil", 
        description: "Gerbang berhasil dihapus" 
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
    mutationFn: (gate: Gate) => {
        const formData = new FormData();
        formData.append('name', gate.name);
        formData.append('is_active', String(!gate.is_active));
        if (gate.description) formData.append('description', gate.description);
        if (gate.location) formData.append('location', gate.location);
        
        return gateApi.updateGate(gate.id_gate, formData);
    },
    onSuccess: (_, gate) => {
        queryClient.invalidateQueries({ queryKey: ["gates"] });
        toast({ 
          title: "Berhasil", 
          description: `Gerbang "${gate.name}" berhasil ${gate.is_active ? 'dinonaktifkan' : 'diaktifkan'}` 
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
    setSelectedGate(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (gate: Gate) => {
    setSelectedGate(gate);
    setIsFormOpen(true);
  };

  const handleDelete = (gate: Gate) => {
    setSelectedGate(gate);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGate) {
      deleteMutation.mutate(selectedGate.id_gate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Gerbang
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola gerbang masuk lokasi wisata
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Gerbang
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Gerbang</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {pagination?.total_records || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <DoorOpen className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Gerbang</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : gates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data gerbang</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Gerbang</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gates.map((gate) => (
                    <TableRow key={gate.id_gate}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <DoorOpen className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{gate.name}</p>
                            <p className="text-xs text-gray-500">{gate.location || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {gate.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={gate.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                          {gate.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatusMutation.mutate(gate)}
                            title={gate.is_active ? "Nonaktifkan" : "Aktifkan"}
                            className={gate.is_active ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50" : "text-green-600 hover:text-green-900 hover:bg-green-50"}
                          >
                            {gate.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(gate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900 hover:bg-red-50" 
                            onClick={() => handleDelete(gate)}
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
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> gerbang
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

      <GateForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        gate={selectedGate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus gerbang "{selectedGate?.name}" secara permanen.
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