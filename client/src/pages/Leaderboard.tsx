import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { leaderboardApi, productCategoryApi } from "@/lib/api";
import type { LeaderboardEntry, ProductCategory } from "@/lib/api";
import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, ThumbsUp, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const LeaderboardTable = ({
    title,
    data,
    isLoading,
    isOverall = false
}: {
    title: string,
    data?: LeaderboardEntry[],
    isLoading: boolean,
    isOverall?: boolean
}) => {
    const topThree = data?.slice(0, 3) || [];
    const others = data?.slice(3) || [];
    const categories = [];

    const rankClasses = [
        "bg-yellow-400 text-yellow-900",
        "bg-slate-300 text-slate-800",
        "bg-amber-600/80 text-amber-900"
    ];

    const medalIconClasses = [
        "text-yellow-500",
        "text-slate-500",
        "text-amber-700"
    ];

    if (isLoading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(isOverall && "border-2 border-amber-500 shadow-lg")}>
            <CardHeader>
                <CardTitle className="flex items-center justify-center">
                    <Award className="mr-2 h-5 w-5 text-amber-500" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <div className="space-y-4">
                        {topThree.map((entry, index) => (
                            <div
                                key={`${title}-${entry.id_product}-${index}`}
                                className="flex items-center p-2 rounded-lg bg-slate-100/50"
                            >
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4", rankClasses[index])}>
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800">{entry.product_name}</p>
                                    <div className="flex items-center text-xs text-slate-500 space-x-2">
                                        <div className="flex items-center">
                                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                            {entry.total_score.toFixed(2)}
                                        </div>
                                        <div className="flex items-center">
                                            <ThumbsUp className="h-3 w-3 mr-1 text-blue-500" />
                                            {entry.rating_count} ratings
                                        </div>
                                    </div>
                                </div>
                                <Medal className={cn("h-6 w-6", medalIconClasses[index])} />
                            </div>
                        ))}
                        {others.length > 0 && (
                            <div className="border-t pt-4 space-y-2">
                                {others.map((entry, index) => (
                                    <div
                                        key={`${title}-${entry.id_product}-${index + 3}`}
                                        className="flex items-center text-sm"
                                    >
                                        <div className="w-8 text-center font-semibold text-slate-500 mr-4">
                                            {index + 4}
                                        </div>
                                        <div className="flex-grow text-slate-700">{entry.product_name}</div>
                                        <div className="font-semibold text-slate-800">{entry.total_score.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-8">No entries yet.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default function Leaderboard() {
    const params = useParams();
    const eventId = params.id_event;

    const {
        data: categories = [],
        isLoading: isLoadingCategoriesList,
        isError: isCategoriesError
    } = useQuery<ProductCategory[]>({
        queryKey: ["productCategories"],
        queryFn: () =>
            productCategoryApi.getProductCategories({ page_size: 999 })
                .then(res => Array.isArray(res.data) ? res.data : [])
                .catch(() => []),
    });

    const {
        data: overallLeaderboard = [],
        isLoading: isLoadingOverall,
        isError: isOverallError
    } = useQuery<LeaderboardEntry[]>({
        queryKey: ["leaderboard", eventId, "overall"],
        queryFn: () => leaderboardApi.getLeaderboard(eventId!, { page_size: 40 }).then(res => res.data),
        enabled: !!eventId,
        refetchInterval: 60000,
    });

    const {
        data: categoryLeaderboards = {},
        isLoading: isLoadingCategories,
        isError: isCategoryLeaderboardsError
    } = useQuery({
        queryKey: ["leaderboard", eventId, "categories", categories.map(c => c.id_category)],
        queryFn: async () => {
            if (!eventId || !Array.isArray(categories) || categories.length === 0) return {};

            const results: Record<string, LeaderboardEntry[]> = {};
            await Promise.all(
                categories.map(async (cat) => {
                    try {
                        const res = await leaderboardApi.getLeaderboard(
                            eventId,
                            { category_id: cat.id_category, page_size: 10 }
                        );
                        results[cat.id_category] = res.data || [];
                    } catch (error) {
                        console.error(`Error fetching category ${cat.id_category}:`, error);
                        results[cat.id_category] = [];
                    }
                })
            );
            return results;
        },
        enabled: !!eventId && categories.length > 0,
    });

    const categoryMidpoint = Math.ceil(categories.length / 2);
    const leftCategories = categories.slice(0, categoryMidpoint);
    const rightCategories = categories.slice(categoryMidpoint);

    if (!eventId) {
        return (
            <PublicLayout>
                <div className="container mx-auto p-4 text-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p>No event ID provided.</p>
                </div>
            </PublicLayout>
        );
    }

    if (isLoadingCategoriesList || isLoadingOverall) {
        return (
            <PublicLayout>
                <div className="container mx-auto p-4">
                    <div className="text-center mb-12">
                        <Skeleton className="h-10 w-1/2 mx-auto" />
                        <Skeleton className="h-6 w-1/3 mx-auto mt-4" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                                <CardContent className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Skeleton key={j} className="h-10 w-full" />
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (isCategoriesError || isOverallError || isCategoryLeaderboardsError) {
        return (
            <PublicLayout>
                <div className="container mx-auto p-4 text-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p>Failed to load leaderboard data. Please try again later.</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout backTo="/" backToText="Back to Dashboard">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Leaderboard
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500">
                        Top performing products for the "FiPex #6" event.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-8">
                        {leftCategories.map(category => (
                            <LeaderboardTable
                                key={`category-${category.id_category}`}
                                title={category.name}
                                data={categoryLeaderboards[category.id_category]}
                                isLoading={isLoadingCategories}
                            />
                        ))}
                    </div>

                    <div className="space-y-8">
                        <LeaderboardTable
                            title="Overall Ranking"
                            data={overallLeaderboard}
                            isLoading={isLoadingOverall}
                            isOverall={true}
                        />
                    </div>

                    <div className="space-y-8">
                        {rightCategories.map(category => (
                            <LeaderboardTable
                                key={`category-${category.id_category}`}
                                title={category.name}
                                data={categoryLeaderboards[category.id_category]}
                                isLoading={isLoadingCategories}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
