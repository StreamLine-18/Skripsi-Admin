import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { guestBookApi, eventApi } from "@/lib/api";
import type { Attendance, Event, GuestBook } from "@/lib/api";
import { useParams, Link } from "wouter";

export default function AttendanceList() {
  const params = useParams();
  const eventId = params.id_event;
  const guestBookId = params.id_guest_book;

  // Fetch the attendance list for this specific guest book
  const { data: attendanceResponse, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["attendanceList", guestBookId],
    queryFn: () => guestBookApi.getAttendancesByGuestBook(guestBookId!),
    enabled: !!guestBookId,
  });
  const attendances: Attendance[] = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];

  // Fetch event and guest book details for the page header
  const { data: eventsResponse } = useQuery({ queryKey: ["events"], queryFn: eventApi.getEvents });
  const { data: guestBooksResponse } = useQuery({ queryKey: ["eventGuestBooks", eventId], queryFn: () => guestBookApi.getGuestBooksByEvent(eventId!), enabled: !!eventId });
  
  const events: Event[] = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
  const guestBooks: GuestBook[] = Array.isArray(guestBooksResponse?.data) ? guestBooksResponse.data : [];
  const currentEvent = events.find((e) => e.id_event === eventId);
  const currentGuestBook = guestBooks.find((gb) => gb.id_guest_book === guestBookId);
  const guestBookDate = currentGuestBook ? new Date(currentGuestBook.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '...';

  const columns = [
    {
      key: "name",
      label: "User",
      render: (item: Attendance) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.full_name}</div>
            <div className="text-xs text-slate-500 font-mono">{item.id_user}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (item: Attendance) => (
        <div className="flex items-center text-sm text-slate-600">
            <Mail className="h-4 w-4 mr-2" />
            {item.email}
        </div>
      ),
    },
    {
      key: "time",
      label: "Attendance Time",
      render: (item: Attendance) => (
        <div className="flex items-center text-sm text-slate-600">
            <Clock className="h-4 w-4 mr-2" />
            {new Date(item.created_on).toLocaleTimeString()}
        </div>
      )
    }
  ];

  if (!guestBookId || !eventId) {
    return <div className="p-4">Error: Missing ID from URL.</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <Link href={`/events/${eventId}/guest-books`}>
            <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guest Books for {currentEvent?.name || ''}
            </Button>
        </Link>
        <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                Attendance for {guestBookDate}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                List of all users who attended on this day.
            </p>
            </div>
        </div>
      </div>

      <DataTable
        title="Attendees"
        description={`A total of ${attendances.length} user(s) attended.`}
        data={attendances.map((att) => ({ ...att, id: att.id_guest_book_attendance }))}
        columns={columns}
        searchPlaceholder="Search by name or email..."
        loading={isLoadingAttendance}
      />
    </div>
  );
}
