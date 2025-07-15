import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowLeft, NotebookPen, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { guestBookApi, eventApi } from "@/lib/api";
import type { GuestBook, Event } from "@/lib/api";
import { useParams, Link } from "wouter";
import { GuestBookForm } from "@/components/forms/GuestBookForm";

export default function EventGuestBooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const eventId = params.id_event;

  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: guestBooksResponse, isLoading: isLoadingGuestBooks } = useQuery({
    queryKey: ["eventGuestBooks", eventId],
    queryFn: () => guestBookApi.getGuestBooksByEvent(eventId!),
    enabled: !!eventId,
  });
  const guestBooks: GuestBook[] = Array.isArray(guestBooksResponse?.data) ? guestBooksResponse.data : [];

  const { data: eventsResponse } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.getEvents,
  });
  const currentEvent = Array.isArray(eventsResponse?.data) 
    ? eventsResponse?.data.find((e: Event) => e.id_event === eventId)
    : undefined;

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (guestBook: GuestBook) => {
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return (
            <Link href={`/events/${eventId}/guest-books/${guestBook.id_guest_book}/attendances`} className="group flex items-center cursor-pointer">
                <NotebookPen className="h-5 w-5 text-slate-400 mr-3" />
                <span className="group-hover:underline">{new Date(guestBook.date).toLocaleDateString('en-US', dateOptions)}</span>
            </Link>
        )
      }
    },
    {
      key: "id",
      label: "Guest Book ID",
      render: (guestBook: GuestBook) => <div className="font-mono text-xs">{guestBook.id_guest_book}</div>
    },
    {
      key: "created",
      label: "Created On",
      render: (guestBook: GuestBook) => new Date(guestBook.created_on).toLocaleString()
    }
  ];

  // UPDATED: The actions column now provides a "View" button
  const actions = (guestBook: GuestBook) => (
    <div className="flex space-x-2">
      <Link href={`/events/${eventId}/guest-books/${guestBook.id_guest_book}/attendances`}>
        <Button variant="ghost" size="sm" title="View Attendances">
            <Eye className="h-4 w-4 " />
        </Button>
      </Link>
    </div>
  );

  if (!eventId) {
    return <div className="p-4">Error: No Event ID provided.</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <Link href="/events">
            <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Events
            </Button>
        </Link>
        <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                Guest Books for: {currentEvent?.name || 'Loading...'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Manage daily guest book entries or view the full attendance report.
            </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0 md:ml-4">
            <Link href={`/events/${eventId}/attendances`}>
              <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Full Report
              </Button>
            </Link>
            <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Guest Book
            </Button>
            </div>
        </div>
      </div>

     <DataTable
        title="Daily Guest Book Entries"
        description={`Select a date to view its attendance list.`}
        data={guestBooks.map(guestBook => ({ ...guestBook, id: guestBook.id_guest_book }))}
        columns={columns}
        searchPlaceholder="Search..."
        loading={isLoadingGuestBooks}
        actions={actions} // Pass the updated actions
      />

      <GuestBookForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={eventId}
      />
    </div>
  );
}
