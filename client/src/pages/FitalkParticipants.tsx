import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, User, Mail, Hash, Building, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { fitalkApi, eventApi } from "@/lib/api";
import type { FitalkParticipant, Event } from "@/lib/api";
import { FitalkParticipantForm } from "@/components/forms/FitalkParticipantForm";

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

export default function FitalkParticipants() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // The specific event ID for the Fitalk event
  const fitalkEventId = "8bc1204a-39bb-40d7-b838-df2b8e9b87d4";

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // The API call now sends all necessary parameters for server-side processing
  const { data: participantsResponse, isLoading } = useQuery({
    queryKey: ["fitalkParticipants", fitalkEventId, currentPage, debouncedSearchTerm],
    queryFn: () => fitalkApi.getParticipants({ 
        id_event: fitalkEventId, 
        page: currentPage, 
        search: debouncedSearchTerm 
    }),
    placeholderData: (keepPreviousData) => keepPreviousData,
  });

  const participants: FitalkParticipant[] = participantsResponse?.data || [];
  const pagination = participantsResponse?.pagination;

  // Fetch event data to display the event name
  const { data: eventsResponse } = useQuery({ queryKey: ["events"], queryFn: () => eventApi.getEvents() });
  const events: Event[] = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
  const eventMap = useMemo(() => new Map(events.map(e => [e.id_event, e.name])), [events]);
  const fitalkEventName = eventMap.get(fitalkEventId) || "Fitalk Event";

  const columns = [
    {
      key: "name",
      label: "Participant",
      render: (item: FitalkParticipant) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.full_name}</div>
            <div className="text-xs text-slate-500 flex items-center"><Hash className="h-3 w-3 mr-1"/>{item.registration_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (item: FitalkParticipant) => (
        <div className="flex items-center text-sm text-slate-600">
            <Mail className="h-4 w-4 mr-2" />
            {item.email}
        </div>
      ),
    },
    {
      key: "institution",
      label: "Institution",
      render: (item: FitalkParticipant) => (
        <div className="flex items-center text-sm text-slate-600">
            <Building className="h-4 w-4 mr-2" />
            {item.home_institution}
        </div>
      )
    },
    {
        key: "registered_on",
        label: "Registered On",
        render: (item: FitalkParticipant) => (
            <div className="flex items-center text-sm text-slate-600">
                <Clock className="h-4 w-4 mr-2" />
                {new Date(item.created_on).toLocaleString()}
            </div>
        )
    }
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Fi-Talk Participants
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage all registered participants for this event.
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-0 md:ml-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-xs"
                />
            </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Participant
          </Button>
        </div>
      </div>

      <DataTable
        title="All Participants"
        description={`List of all participants for the ${fitalkEventName} event.`}
        data={participants.map(participant => ({ ...participant, id: participant.id_fitalk_participant }))}
        searchPlaceholder="Search by name or email"
        columns={columns}
        loading={isLoading}
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

      <FitalkParticipantForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={fitalkEventId}
      />
    </div>
  );
}
