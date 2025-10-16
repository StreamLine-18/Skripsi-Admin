import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Newspaper, ChevronLeft, ChevronRight, Power, PowerOff } from "lucide-react";
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
import { newsApi } from "@/lib/api";
import type { News } from "@/lib/api";
import { NewsForm } from "@/components/forms/NewsForm";

export default function NewsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["news", currentPage],
    queryFn: () => newsApi.getAllNews({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const news: News[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsApi.deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Success", description: "News article deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (newsItem: News) => {
        const newStatus = newsItem.status === "Published" ? "Draft" : "Published";
        // Endpoint update menggunakan FormData, jadi kita harus mengirim data dalam format ini.
        const formData = new FormData();
        formData.append('status', newStatus);
        formData.append('title', newsItem.title); // Kirim data yang ada untuk menghindari validasi error di backend
        formData.append('content', newsItem.content);
        return newsApi.updateNews(newsItem.id_news, formData);
    },
    onSuccess: (_, newsItem) => {
        queryClient.invalidateQueries({ queryKey: ["news"] });
        const newStatus = newsItem.status === "Published" ? "Unpublished" : "Published";
        toast({ title: "Success", description: `Article has been ${newStatus}.` });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });


  const handleCreate = () => {
    setSelectedNews(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsFormOpen(true);
  };

  const handleDelete = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedNews) {
      deleteMutation.mutate(selectedNews.id_news);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (item: News) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.title}</div>
            <div className="text-xs text-slate-500">By {item.author_name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: News) => (
        <Badge variant={item.status === 'Published' ? "default" : "secondary"} className={item.status === 'Published' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
          {item.status}
        </Badge>
      ),
    },
    {
        key: "published_at",
        label: "Published Date",
        render: (item: News) => item.published_at ? new Date(item.published_at).toLocaleDateString('en-GB') : 'Not Published'
    }
  ];

  const actions = (item: News) => (
    <div className="flex space-x-1">
      <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(item)} title={item.status === 'Published' ? "Unpublish" : "Publish"}>
        {item.status === 'Published' ? <PowerOff className="h-4 w-4 text-yellow-600" /> : <Power className="h-4 w-4 text-emerald-600" />}
      </Button>
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
            News Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and manage news articles.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add News
          </Button>
        </div>
      </div>

      <DataTable
        title="All News Articles"
        description="List of all news articles."
        data={news.map(n => ({ ...n, id: n.id_news }))}
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

      <NewsForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        newsItem={selectedNews}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the article "{selectedNews?.title}".
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