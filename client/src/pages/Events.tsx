import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Calendar as CalendarIcon, NotebookPen } from "lucide-react";
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
import type { Event } from "@/lib/api";
import { EventForm } from "@/components/forms/EventForm";
import { Link } from "wouter";

const parseDate = (dateStr: string, timeStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const getEventStatus = (startDate: Date, endDate: Date): { text: string; className: string } => {
    const now = new Date();
    if (endDate < now) {
        return { text: "Finished", className: "bg-red-100 text-red-800" };
    }
    if (startDate > now) {
        return { text: "Upcoming", className: "bg-yellow-100 text-yellow-800" };
    }
    return { text: "Active", className: "bg-emerald-100 text-emerald-800" };
};

export default function Events() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.getEvents,
  });
  const events: Event[] = Array.isArray(apiResponse?.data) ? apiResponse.data : [];

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

  const handleCreate = () => {
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id_event);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Event",
      render: (event: Event) => (
        <Link href={`/events/${event.id_event}/guest-books`} className="flex items-center group cursor-pointer">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 group-hover:underline">{event.name}</div>
            <div className="text-sm text-slate-500 font-mono">{event.id_event}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "duration",
      label: "Event Duration",
      render: (event: Event) => {
        const startDate = parseDate(event.start_date, event.start_time);
        const endDate = parseDate(event.end_date, event.end_time);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return (
            <div>
                <div className="text-sm text-slate-900">
                    {startDate.toLocaleDateString('en-US', options)} - {endDate.toLocaleDateString('en-US', options)}
                </div>
                <div className="text-xs text-slate-500">
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        )
      }
    },
    {
      key: "status",
      label: "Status",
      render: (event: Event) => {
        const startDate = parseDate(event.start_date, event.start_time);
        const endDate = parseDate(event.end_date, event.end_time);
        const status = getEventStatus(startDate, endDate);
        return <Badge className={status.className}>{status.text}</Badge>;
      },
    },
  ];

  const actions = (event: Event) => (
    <div className="flex space-x-2">
      <Link href={`/events/${event.id_event}/guest-books`}>
        <Button variant="ghost" size="sm" title="View Guest Books">
            <NotebookPen className="h-4 w-4" />
        </Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(event)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Events
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse and manage all company events.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <DataTable
        title="All Events"
        description="List of all past, active, and upcoming events."
        data={events.map(event => ({ ...event, id: event.id_event}))}
        columns={columns}
        searchPlaceholder="Search by name or ID..."
        loading={isLoading}
        actions={actions}
      />

      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        event={selectedEvent}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event "{selectedEvent?.name}". This cannot be undone.
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
