import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createHttpClient } from "@/utils/api/createHttpClient";
import { IconChecklist, IconBulb } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Stats } from "../data/schema";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/error-state";

export default function SectionCards() {

    const httpClient = createHttpClient();

    const { data: stats, error, isLoading, refetch } = useQuery<Stats>({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => httpClient.get('/api/dashboard/stats')
    })

    if (isLoading) return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <Skeleton className="h-23 bg-secondary/20" />
            <Skeleton className="h-23 bg-secondary/20" />
            <Skeleton className="h-23 bg-secondary/20" />
        </div>
    )

    if (error) return (
        <Card>
            <ErrorState
                title="Stats Unavailable"
                message="Your dashboard stats couldn't be loaded right now. Please try again or contact support if the issue persists."
                action={refetch} />
        </Card>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">Active Topics</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats && stats?.activeTopics}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-success/20">
                            <IconChecklist className="text-success-foreground" size={24} />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            {/* <Card>
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Feedback pending your review
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats && stats?.feedbackPendingReview}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-tertiary/20">
                            <IconMessage2 className="text-tertiary-foreground" size={24} />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card> */}
            <Card>
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Recent Insights Generated
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats && stats?.recentInsightsGenerated}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-warning/20">
                            <IconBulb className="text-warning-foreground" size={24} />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
        </div>
    )
}