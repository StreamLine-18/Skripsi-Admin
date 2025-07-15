import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, User, Mail, Hash, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fitalkApi } from "@/lib/api";
import type { FitalkAttendance } from "@/lib/api";
import { FitalkAttendanceForm } from "@/components/forms/FitalkAttendanceForm";

export default function FitalkAttendancePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const fitalkEventId = "8bc1204a-39bb-40d7-b838-df2b8e9b87d4";

  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ["fitalkAttendances", fitalkEventId, currentPage],
    queryFn: () => fitalkApi.getAttendances(fitalkEventId, currentPage),

  });
  const attendances: FitalkAttendance[] = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
  const pagination = attendanceResponse?.pagination;

  const columns = [
    {
      key: "name",
      label: "Attendee",
      render: (item: FitalkAttendance) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{item.name}</div>
            <div className="text-xs text-slate-500 flex items-center"><Hash className="h-3 w-3 mr-1"/>{item.id_registration}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (item: FitalkAttendance) => (
        <div className="flex items-center text-sm text-slate-600">
            <Mail className="h-4 w-4 mr-2" />
            {item.email}
        </div>
      ),
    },
    {
      key: "attended_on",
      label: "Attended On",
      render: (item: FitalkAttendance) => (
        <div className="flex items-center text-sm text-slate-600">
            <Clock className="h-4 w-4 mr-2" />
            {new Date(item.attended_on).toLocaleString()}
        </div>
      )
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Fi-Talk Attendance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Record and view attendance for the Fitalk event.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
        </div>
      </div>

      <DataTable
        title="Attendance List"
        description="List of all users who have attended the Fitalk event."
        data={attendances.map(attendance => ({ ...attendance, id: attendance.id_fitalk_attendance }))}
        columns={columns}
        searchPlaceholder="Search by name, email, or ID..."
        loading={isLoading}
      />

      {/* Pagination Controls */}
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

      <FitalkAttendanceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={fitalkEventId}
      />
    </div>
  );
}
