import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, DoorOpen, ChevronLeft, ChevronRight, Power, PowerOff } from "lucide-react";
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
import { gateApi } from "@/lib/api";
import type { Gate } from "@/lib/api";
import { GateForm } from "@/components/forms/GatesForm";

export default function Gates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["gates", currentPage],
    queryFn: () => gateApi.getGates({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const gates: Gate[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gateApi.deleteGate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gates"] });
      toast({ title: "Success", description: "Gate deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const toggleStatusMutation = useMutation({
    mutationFn: (gate: Gate) => 
        gateApi.updateGate(gate.id_gate, { is_active: !gate.is_active }),
    onSuccess: (_, gate) => {
        queryClient.invalidateQueries({ queryKey: ["gates"] });
        toast({ title: "Success", description: `Gate "${gate.name}" has been ${gate.is_active ? 'deactivated' : 'activated'}.` });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const columns = [
    {
      key: "name",
      label: "Gate Name",
      render: (gate: Gate) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{gate.name}</div>
            <div className="text-xs text-slate-500">{gate.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (gate: Gate) => (
        <Badge variant={gate.is_active ? "default" : "secondary"} className={gate.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
          {gate.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions = (gate: Gate) => (
    <div className="flex space-x-1">
      <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(gate)} title={gate.is_active ? "Deactivate" : "Activate"}>
        {gate.is_active ? <PowerOff className="h-4 w-4 text-yellow-600" /> : <Power className="h-4 w-4 text-emerald-600" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleEdit(gate)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(gate)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Gate Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage entrance gates for the location.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Gate
          </Button>
        </div>
      </div>

      <DataTable
        title="All Gates"
        description="List of all available entrance gates."
        data={gates.map(g => ({ ...g, id: g.id_gate }))}
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

      <GateForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        gate={selectedGate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the gate "{selectedGate?.name}".
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
