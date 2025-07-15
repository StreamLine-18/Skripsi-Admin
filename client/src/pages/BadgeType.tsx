import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Award } from "lucide-react";
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
import { badgeApi } from "@/lib/api";
import type { BadgeType } from "@/lib/api";
import { BadgeForm } from "@/components/forms/BadgeForm";

export default function Badges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | undefined>();

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: badgeApi.getBadges,
  });
  const badges: BadgeType[] = Array.isArray(apiResponse?.data) ? apiResponse.data : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => badgeApi.deleteBadge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast({ title: "Success", description: "Badge deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setSelectedBadge(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (badge: BadgeType) => {
    setSelectedBadge(badge);
    setIsFormOpen(true);
  };

  const handleDelete = (badge: BadgeType) => {
    setSelectedBadge(badge);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBadge) {
      deleteMutation.mutate(selectedBadge.id_badge_type);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Badge",
      render: (badge: BadgeType) => (
        <div className="flex items-center">
          <img src={badge.image_url} alt={badge.name} className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.src = "https://placehold.co/40x40/e2e8f0/64748b?text=B"; }} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{badge.name}</div>
            <div className="text-xs text-slate-500 font-mono">{badge.id_badge_type}</div>
          </div>
        </div>
      ),
    },
    {
      key: "value",
      label: "Value",
      render: (badge: BadgeType) => <div className="text-sm font-medium">{badge.value}</div>,
    },
  ];

  const actions = (badge: BadgeType) => (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(badge)}><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(badge)}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Badge Types
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage badge types for your application.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Badge
          </Button>
        </div>
      </div>

      <DataTable
        title="All Badge Types"
        description="List of all available badge types."
        data={badges.map(badge => ({ ...badge, id: badge.id_badge_type}))}
        columns={columns}
        searchPlaceholder="Search by name..."
        loading={isLoading}
        actions={actions}

      />

      <BadgeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        badge={selectedBadge}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the badge "{selectedBadge?.name}". This cannot be undone.
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
