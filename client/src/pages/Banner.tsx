import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Power, PowerOff, ChevronLeft, ChevronRight } from "lucide-react";
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
import { bannerApi } from "@/lib/api";
import type { Banner } from "@/lib/api";
import { BannerForm } from "@/components/forms/BannerForm";

export default function Banners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // The API call now only depends on the current page for pagination.
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["banners", currentPage],
    queryFn: () => bannerApi.getBanners({ page: currentPage }),
    placeholderData: (previousData) => previousData,
  });
  
  const banners: Banner[] = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Success", description: "Banner deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (banner: Banner) => {
        return banner.is_active ? bannerApi.deactivateBanner(banner.id_banner) : bannerApi.activateBanner(banner.id_banner);
    },
    onSuccess: (_, banner) => {
        queryClient.invalidateQueries({ queryKey: ["banners"] });
        toast({ title: "Success", description: `Banner has been ${banner.is_active ? 'deactivated' : 'activated'}.` });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleCreate = () => {
    setSelectedBanner(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleDelete = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBanner) {
      deleteMutation.mutate(selectedBanner.id_banner);
    }
  };

  const columns = [
    {
      key: "image",
      label: "Banner Image",
      render: (banner: Banner) => (
        <div className="p-2">
          <img
            src={banner.image_url}
            alt="Banner"
            className="h-16 w-32 object-cover rounded-md bg-slate-200 shadow-sm"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "https://placehold.co/128x64/e2e8f0/64748b?text=Error";
            }}
          />
        </div>
      ),
    },
    {
      key: "id",
      label: "ID",
      render: (banner: Banner) => <div className="font-mono text-xs">{banner.id_banner}</div>
    },
    {
      key: "status",
      label: "Status",
      render: (banner: Banner) => (
        <Badge variant={banner.is_active ? "default" : "secondary"} className={banner.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
          {banner.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions = (banner: Banner) => (
    <div className="flex space-x-1">
      <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(banner)} title={banner.is_active ? "Deactivate" : "Activate"}>
        {banner.is_active ? <PowerOff className="h-4 w-4 text-yellow-600" /> : <Power className="h-4 w-4 text-emerald-600" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(banner)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Banners
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage the promotional banners for your application.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </div>

      <DataTable
        title="All Banners"
        description="List of all available promotional banners."
        data={banners.map(banner => ({ ...banner, id: banner.id_banner}))}
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
                <span className="ml-2">Previous</span>
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
            disabled={pagination.page === pagination.total_pages}
            >
                <span className="mr-2">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}

      <BannerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        banner={selectedBanner}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this banner. This cannot be undone.
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
