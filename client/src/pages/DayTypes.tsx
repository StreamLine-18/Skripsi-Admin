import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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
import { dayTypeApi } from "@/lib/api";
import type { DayType } from "@/lib/api";
import { DayTypeForm } from "@/components/forms/DayTypeForm";

export default function DayTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDayType, setSelectedDayType] = useState<DayType | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["dayTypes", currentPage],
    queryFn: () => dayTypeApi.getDayTypes({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const dayTypes: DayType[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dayTypeApi.deleteDayType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dayTypes"] });
      toast({ title: "Success", description: "Day type deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setSelectedDayType(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (dayType: DayType) => {
    setSelectedDayType(dayType);
    setIsFormOpen.bind(null, true)();
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

  const columns = [
    {
      key: "name",
      label: "Day Type Name",
      render: (dayType: DayType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{dayType.name}</div>
            <div className="text-xs text-slate-500">{dayType.description}</div>
          </div>
        </div>
      ),
    },
  ];

  const actions = (dayType: DayType) => (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(dayType)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(dayType)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Day Type Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage day types for ticket pricing (e.g., Weekday, Weekend).
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Day Type
          </Button>
        </div>
      </div>

      <DataTable
        title="All Day Types"
        description="List of all available day types."
        data={dayTypes.map(dt => ({ ...dt, id: dt.id_day_type }))}
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

      <DayTypeForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        dayType={selectedDayType}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the day type "{selectedDayType?.name}".
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
