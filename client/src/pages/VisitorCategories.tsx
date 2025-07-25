import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, UsersRound, ChevronLeft, ChevronRight } from "lucide-react";
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
import { visitorCategoryApi } from "@/lib/api";
import type { VisitorCategory } from "@/lib/api";
import { VisitorCategoryForm } from "@/components/forms/VisitorCategoryForm";

export default function VisitorCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VisitorCategory | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["visitorCategories", currentPage],
    queryFn: () => visitorCategoryApi.getVisitorCategories({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const categories: VisitorCategory[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => visitorCategoryApi.deleteVisitorCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitorCategories"] });
      toast({ title: "Success", description: "Visitor category deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (category: VisitorCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: VisitorCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id_category);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Category Name",
      render: (category: VisitorCategory) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <UsersRound className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{category.name}</div>
            <div className="text-xs text-slate-500">{category.description}</div>
          </div>
        </div>
      ),
    },
  ];

  const actions = (category: VisitorCategory) => (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(category)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Visitor Category Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage visitor categories for ticket pricing (e.g., Domestic, International).
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <DataTable
        title="All Visitor Categories"
        description="List of all available visitor categories."
        data={categories.map(cat => ({ ...cat, id: cat.id_category }))}
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

      <VisitorCategoryForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={selectedCategory}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the category "{selectedCategory?.name}".
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
