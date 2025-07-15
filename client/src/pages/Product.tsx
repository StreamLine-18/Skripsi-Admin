import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query'
import { Edit, Trash2, Plus, Users, Calendar, Tag, ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
import { productApi, teamApi, productCategoryApi, eventApi } from "@/lib/api";
import type { Product, Team, ProductCategory, Event } from "@/lib/api";
import { ProductForm } from "@/components/forms/ProductForm";
import { useLocation, Link } from "wouter";

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

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const searchParams = new URLSearchParams(window.location.search);
  const categoryIdFromUrl = searchParams.get("category_id");

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryIdFromUrl]);

  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({ 
    queryKey: ["products", currentPage, debouncedSearchTerm, categoryIdFromUrl], 
    queryFn: () => productApi.getProducts({ 
        page: currentPage, 
        search: debouncedSearchTerm,
        category_id: categoryIdFromUrl || undefined,
    }),
    placeholderData: keepPreviousData,
  });
  
  const products: Product[] = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // --- UPDATED: Fetch ALL related data for the lookup maps ---
  const { data: teamsResponse } = useQuery({ 
    queryKey: ["teams", "all"], 
    queryFn: () => teamApi.getTeams({ page_size: 9999 }) 
  });
  const { data: categoriesResponse } = useQuery({ 
    queryKey: ["productCategories", "all"], 
    queryFn: () => productCategoryApi.getProductCategories({ page_size: 9999 }) 
  });
  const { data: eventsResponse } = useQuery({ 
    queryKey: ["events", "all"], 
    queryFn: () => eventApi.getEvents({ page_size: 9999 }) 
  });
  
  const teams: Team[] = teamsResponse?.data || [];
  const categories: ProductCategory[] = categoriesResponse?.data || [];
  const events: Event[] = eventsResponse?.data || [];

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id_team, t.name])), [teams]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id_category, c.name])), [categories]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id_event, e.name])), [events]);
  const categoryName = categoryIdFromUrl ? categoryMap.get(categoryIdFromUrl) : null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: "Product deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => setSelectedProduct(undefined);
  const handleEdit = (product: Product) => setSelectedProduct(product);
  const handleDelete = (product: Product) => setSelectedProduct(product);
  const confirmDelete = () => {
    if (selectedProduct) deleteMutation.mutate(selectedProduct.id_product);
  };

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (product: Product) => (
        <div className="flex items-center">
          <img src={product.image_urls[0]} alt={product.name} className="h-10 w-10 rounded-md object-cover bg-slate-200" onError={(e) => { e.currentTarget.src = "https://placehold.co/40x40/e2e8f0/64748b?text=P"; }} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{product.name}</div>
            <div className="text-xs text-slate-500 font-mono">{product.id_product}</div>
          </div>
        </div>
      ),
    },
    { key: "team", label: "Team", render: (p: Product) => <div className="flex items-center text-sm"><Users className="h-4 w-4 mr-2 text-muted-foreground" />{teamMap.get(p.id_team) || '...'}</div> },
    { key: "category", label: "Category", render: (p: Product) => <div className="flex items-center text-sm"><Tag className="h-4 w-4 mr-2 text-muted-foreground" />{categoryMap.get(p.id_category) || '...'}</div> },
    { key: "event", label: "Event", render: (p: Product) => <div className="flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" />{eventMap.get(p.id_event) || '...'}</div> },
  ];

  const actions = (product: Product) => (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={() => { handleEdit(product); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => { handleDelete(product); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {categoryIdFromUrl && (
        <Link href="/products-category">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Categories
          </Button>
        </Link>
      )}
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            {categoryName ? `Products in ${categoryName}` : "All Products"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {categoryName ? `A list of all products in the "${categoryName}" category.` : "Manage all submitted products."}
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
          <Button onClick={() => { handleCreate(); setIsFormOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </div>
      </div>

      <DataTable
        data={products.map(product => ({ ...product, id: product.id_product }))}
        title="Products"
        columns={columns}
        loading={isLoadingProducts}
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

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={selectedProduct}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action will permanently delete the product "{selectedProduct?.name}".</AlertDialogDescription>
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
