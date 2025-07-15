import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User as UserIcon, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { badgeApi, userApi } from "@/lib/api";
import type { UserBadge, User } from "@/lib/api";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { AddUserBadgeForm } from "@/components/forms/AddUserBadgesForm"; // Import the form

export default function UserBadges() {
  const params = useParams();
  const userId = params.id_user;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch the badges for this specific user
  const { data: badgesResponse, isLoading: isLoadingBadges } = useQuery({
    queryKey: ["userBadges", userId],
    queryFn: () => badgeApi.getUserBadges(userId!),
    enabled: !!userId,
  });
  const badges: UserBadge[] = badgesResponse?.data || [];

  // Fetch user details to display their name
  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: userApi.getUserById.bind(null, userId!),
  });
  const currentUser = usersResponse?.data.full_name
console.log(currentUser);

  if (!userId) {
    return <div className="p-4">Error: No User ID provided.</div>;
  }
  
  if (isLoadingBadges) {
    return (
        <div className="p-4 md:p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <Link href="/users">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Users
          </Button>
        </Link>
        <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        {currentUser}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Badges earned by this user.
                    </p>
                </div>
            </div>
            <div className="mt-4 md:mt-0">
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Badge
                </Button>
            </div>
        </div>
      </div>
      
      {badges.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {badges.map(badge => (
                <Card key={badge.id_user_event_badge} className="text-center">
                    <CardHeader>
                        <img 
                            src={badge.badge_type_image_url} 
                            alt={badge.badge_type_name} 
                            className="w-20 h-20 mx-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/80x80/e2e8f0/64748b?text=Error';
                                e.currentTarget.onerror = null;
                            }}
                        />
                    </CardHeader>
                    <CardContent>
                        <CardTitle className="text-md">{badge.badge_type_name}</CardTitle>
                        <CardDescription>
                            <Badge variant="secondary" className="mt-2">
                                Quantity: {badge.quantity}
                            </Badge>
                        </CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Award className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-slate-500">This user has not earned any badges yet.</p>
        </div>
      )}

      <AddUserBadgeForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        userId={userId}
      />
    </div>
  );
}
