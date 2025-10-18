import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Power, PowerOff } from "lucide-react";
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
import { eventApi } from "@/lib/api";
import type { Event as EventType } from "@/lib/api";
import { EventForm } from "@/components/forms/EventForm";

export default function EventsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["events", currentPage],
    queryFn: () => eventApi.getAllEvents({ page: currentPage, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });

  const events: EventType[] = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Success", description: "Event deleted successfully." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (eventItem: EventType) => {
      const newStatus = eventItem.status === "Published" ? "Draft" : "Published";
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('title', eventItem.title);
      formData.append('content', eventItem.content);
      formData.append('location', eventItem.location);
      formData.append('event_date', new Date(eventItem.event_date).toISOString());
      return eventApi.updateEvent(eventItem.id_event, formData);
    },
    onSuccess: (_, eventItem) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      const newStatus = eventItem.status === "Published" ? "Unpublished" : "Published";
      toast({ title: "Success", description: `Event has been ${newStatus}.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleCreate = () => {
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (eventItem: EventType) => {
    setSelectedEvent(eventItem);
    setIsFormOpen(true);
  };

  const handleDelete = (eventItem: EventType) => {
    setSelectedEvent(eventItem);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id_event);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Event",
      render: (item: EventType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.title}</div>
            <div className="text-xs text-slate-500">{item.location}</div>
          </div>
        </div>
      ),
    },
    {
      key: "event_date",
      label: "Event Date",
      render: (item: EventType) => new Date(item.event_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
    },
    {
      key: "status",
      label: "Status",
      render: (item: EventType) => (
        <Badge variant={item.status === 'Published' ? "default" : "secondary"} className={item.status === 'Published' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  const actions = (item: EventType) => (
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
            Event Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and manage events.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <DataTable
        title="All Events"
        description="List of all scheduled events."
        data={events.map(e => ({ ...e, id: e.id_event }))}
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

      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventItem={selectedEvent}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event "{selectedEvent?.title}".
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