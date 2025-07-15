import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, User, Mail, ArrowLeft } from "lucide-react";
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
import { teamMemberApi, teamApi } from "@/lib/api";
import type { TeamMember, Team } from "@/lib/api";
import { TeamMemberForm } from "@/components/forms/TeamMemberForm";
import { useParams, Link } from "wouter";

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const teamId = params.teamId;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>();

  // Fetch the members for this specific team
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: () => teamMemberApi.getTeamMembers(teamId!),
    enabled: !!teamId,
  });
  const members: TeamMember[] = Array.isArray(membersResponse?.data) ? membersResponse.data : [];
  
  // Fetch details of the current team to display its name
  const { data: teamsResponse } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamApi.getTeamById(teamId!),
  });;
  const currentTeam = teamsResponse?.data.name

  const removeMutation = useMutation({
    mutationFn: (id_user: string) => teamMemberApi.removeTeamMember(teamId!, id_user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
      toast({ title: "Success", description: "Member removed from team." });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleRemove = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const confirmRemove = () => {
    if (selectedMember) {
      removeMutation.mutate(selectedMember.id_user);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Member Name",
      render: (member: TeamMember) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{member.full_name}</div>
             <div className="text-xs text-slate-500 font-mono">{member.id_user}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (member: TeamMember) => (
        <div className="flex items-center text-sm text-slate-600">
            <Mail className="h-4 w-4 mr-2" />
            {member.email}
        </div>
      ),
    },
  ];

  const actions = (member: TeamMember) => (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleRemove(member)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  if (!teamId) {
    return <div className="p-4">Error: No Team ID provided.</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <Link href="/team-management">
            <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Teams
            </Button>
        </Link>
        <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                Team Members: {currentTeam}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Manage members for this team.
            </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Member
            </Button>
            </div>
        </div>
      </div>

      <DataTable
        title="Current Members"
        description={`List of all members in the "${currentTeam}" team.`}
        data={members.map(member => ({ ...member, id: member.id_user }))}
        columns={columns}
        searchPlaceholder="Search by name or email..."
        loading={isLoadingMembers}
        actions={actions}
        
      />

      <TeamMemberForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        teamId={teamId}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove "{selectedMember?.full_name}" from the team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700" disabled={removeMutation.isPending}>
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
