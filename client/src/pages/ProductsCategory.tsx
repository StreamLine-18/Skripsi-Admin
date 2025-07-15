import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
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
import { productCategoryApi } from "@/lib/api";
import type { ProductCategory } from "@/lib/api";
import { ProductCategoryForm } from "@/components/forms/ProductCategoryForm";
import { Link } from "wouter";

// A custom hook for debouncing search input
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // The API call now sends the current page and search term for server-side processing.
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["productCategories", currentPage, debouncedSearchTerm],
    queryFn: () => productCategoryApi.getProductCategories({ page: currentPage, search: debouncedSearchTerm }),
    placeholderData: (keepPreviousData) => keepPreviousData,
  });
  
  const productCategories: ProductCategory[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productCategoryApi.deleteProductCategory(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["productCategories"] });
        toast({ title: "Success", description: "Category deleted successfully." });
        setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message || "Failed to delete category.", variant: "destructive" });
    }
  });

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };
  
  const handleDelete = (category: ProductCategory) => {
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
      render: (category: ProductCategory) => (
        <Link href={`/products?category_id=${category.id_category}`} className="flex items-center group cursor-pointer">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              src={category.icon_url} 
              alt={category.name} 
              className="h-10 w-10 rounded-full object-cover bg-slate-200"
              onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.outerHTML = `<div class="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="m7 10 5 3 5-3"/><path d="M12 22V13"/><path d="M20 14.5a4.5 4.5 0 0 0-8.73-1.4"/><path d="M12 13h.01"/></svg></div>`;
              }}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 group-hover:underline">{category.name}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (category: ProductCategory) => (
        <div className="text-sm text-slate-500 font-mono">{category.id_category}</div>
      ),
    },
  ];

  const actions = (category: ProductCategory) => (
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
            Product Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse and manage product categories.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-xs"
                />
            </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <DataTable
        title="All Categories"
        description="List of all available product categories."
        data={productCategories.map(category => ({ ...category, id: category.id_category }))}
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
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={pagination.page === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
            disabled={pagination.page === pagination.total_pages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}

      <ProductCategoryForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={selectedCategory}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the category "{selectedCategory?.name}". This cannot be undone.
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
