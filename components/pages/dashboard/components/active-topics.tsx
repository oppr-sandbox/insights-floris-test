import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Topic } from "../data/schema";
import TopicItem from "./topic-item";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createHttpClient } from "@/utils/api/createHttpClient";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function ActiveTopics() {

    const { tenant } = useUserDetails();
    const httpClient = createHttpClient();

    const { data: topics, error, isLoading, refetch } = useQuery<Topic[]>({
        queryKey: ['my-active-topics'],
        queryFn: () => httpClient.get('/api/topics/assigned')
    });

    const activeTopics = topics?.slice(0, 3);

    if (error) return (
        <Card>
            <ErrorState
                title="Unable to Load Topics"
                message="We couldn't fetch the active topics. Please try again or contact support if the issue persists."
                action={refetch} />
        </Card>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center gap-2">
                        <span>My Active Topics</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Quick access to topics you&apos;re involved in that are currently open.
                </CardDescription>
                <CardAction>
                    <Link href={`/${tenant}/feedbacks`} className="flex gap-2 items-center text-primary font-semibold text-xs underline-offset-4">
                        View All
                        {
                            topics && topics.length > 0 && (
                                <span className="text-center text-xs bg-primary/50 rounded-full w-5.5 h-5.5 p-0.5">
                                    {topics.length}
                                </span>
                            )
                        }
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-55 bg-secondary/20" />
                    </div>
                ) : activeTopics && activeTopics.length > 0 ? (
                    activeTopics.map(topic => <TopicItem key={topic.id} {...topic} />)
                ) : (
                    <EmptyState
                        title="No Topics Yet"
                        description="Once topics are created, they'll appear here."
                        icons={[BookOpen]}
                    />
                )}
            </CardContent>
        </Card>
    )
}