import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, Ticket as TicketIcon, ChevronLeft, ChevronRight, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ticketPriceApi } from "@/lib/api";
import type { TicketPrice } from "@/lib/api";
import { TicketPriceForm } from "@/components/forms/TicketPriceForm";

export default function TicketPrices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicketPrice, setSelectedTicketPrice] = useState<TicketPrice | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["ticketPrices", currentPage],
    queryFn: () => ticketPriceApi.getTicketPrices({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const ticketPrices: TicketPrice[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketPriceApi.deleteTicketPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketPrices"] });
      toast({ title: "Success", description: "Ticket price deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (ticketPrice: TicketPrice) => 
        ticketPriceApi.updateTicketPrice(ticketPrice.id_ticket_price, { is_active: !ticketPrice.is_active }),
    onSuccess: (_, ticketPrice) => {
        queryClient.invalidateQueries({ queryKey: ["ticketPrices"] });
        toast({ title: "Success", description: `Ticket price has been ${ticketPrice.is_active ? 'deactivated' : 'activated'}.` });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const columns = [
    {
      key: "details",
      label: "Ticket Details",
      render: (tp: TicketPrice) => (
        <div>
          {/* FIX: Use optional chaining to prevent crash if nested data is missing */}
          <p className="font-medium">{tp.gate?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">
            {tp.category?.name || 'N/A'} - {tp.dayType?.name || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (tp: TicketPrice) => (
        <div className="text-sm font-semibold">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(tp.price))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (tp: TicketPrice) => (
        <Badge variant={tp.is_active ? "default" : "secondary"} className={tp.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
          {tp.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions = (ticketPrice: TicketPrice) => (
    <div className="flex space-x-1">
       <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(ticketPrice)} title={ticketPrice.is_active ? "Deactivate" : "Activate"}>
        {ticketPrice.is_active ? <PowerOff className="h-4 w-4 text-yellow-600" /> : <Power className="h-4 w-4 text-emerald-600" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleEdit(ticketPrice)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(ticketPrice)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Ticket Price Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Define ticket prices based on gate, visitor category, and day type.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Price
          </Button>
        </div>
      </div>

      <DataTable
        title="All Ticket Prices"
        description="List of all defined ticket prices."
        data={ticketPrices.map(tp => ({ ...tp, id: tp.id_ticket_price }))}
        columns={columns}
        loading={isLoading}
        actions={actions}
      />

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
            disabled={pagination.page === pagination.total_pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <TicketPriceForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        ticketPrice={selectedTicketPrice}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this ticket price.
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
