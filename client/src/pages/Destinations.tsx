import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query';
import { Edit, Trash2, Plus, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import { destinationApi } from "@/lib/api"; // <-- Ganti ke destinationApi
import type { Destination } from "@/lib/api"; // <-- Ganti ke type Destination
import { DestinationForm } from "@/components/forms/DestinationForm"; // <-- Ganti ke DestinationForm

export default function DestinationsPage() { // <-- Ganti nama fungsi
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | undefined>(); // <-- Ganti state
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["destinations", currentPage], // <-- Ganti queryKey
    queryFn: () => destinationApi.getAllDestinations({ page: currentPage, pageSize: 10 }), // <-- Ganti fungsi API
    placeholderData: keepPreviousData,
  });

  const destinations: Destination[] = apiResponse?.data || []; // <-- Ganti nama variabel
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => destinationApi.deleteDestination(id), // <-- Ganti fungsi API
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] }); // <-- Ganti queryKey
      toast({ title: "Success", description: "Destination deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setSelectedDestination(undefined); // <-- Ganti state
    setIsFormOpen(true);
  };

  const handleEdit = (item: Destination) => { // <-- Ganti tipe parameter
    setSelectedDestination(item); // <-- Ganti state
    setIsFormOpen(true);
  };

  const handleDelete = (item: Destination) => { // <-- Ganti tipe parameter
    setSelectedDestination(item); // <-- Ganti state
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDestination) {
      deleteMutation.mutate(selectedDestination.id_destination); // <-- Ganti ID
    }
  };

  const columns = [
    {
      key: "name",
      label: "Destination",
      render: (item: Destination) => ( // <-- Ganti tipe parameter
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-slate-600" /> {/* <-- Icon yang sesuai */}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.name}</div>
            <div className="text-xs text-slate-500">Gate: {item.gate?.name || 'N/A'}</div> {/* Tampilkan nama gate */}
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (item: Destination) => <p className="text-sm text-slate-600 font-mono">{item.slug}</p>
    },
    {
        key: "updated_on",
        label: "Last Updated",
        render: (item: Destination) => new Date(item.updated_on).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }
  ];

  const actions = (item: Destination) => ( // <-- Ganti tipe parameter
    <div className="flex space-x-1">
      {/* Tombol publish/unpublish bisa ditambahkan di sini jika diperlukan */}
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Destination Management {/* <-- Ganti judul */}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and manage destinations. {/* <-- Ganti deskripsi */}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Destination {/* <-- Ganti teks tombol */}
          </Button>
        </div>
      </div>

      <DataTable
        title="All Destinations" // <-- Ganti judul tabel
        description="List of all destinations available." // <-- Ganti deskripsi tabel
        data={destinations.map(d => ({ ...d, id: d.id_destination }))} // <-- Ganti ID
        columns={columns}
        loading={isLoading}
        actions={actions}
      />

      {/* ... (Kode pagination tetap sama) ... */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={pagination.page === 1}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))} disabled={pagination.page === pagination.total_pages}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      <DestinationForm // <-- Ganti komponen form
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        destinationItem={selectedDestination} // <-- Ganti nama prop
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the destination "{selectedDestination?.name}". {/* <-- Ganti teks */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}