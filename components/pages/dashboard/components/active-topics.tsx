import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Topic } from "../data/schema";
import TopicItem from "./topic-item";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function ActiveTopics() {

    const { tenant } = useUserDetails();

    const data = useQuery(api.topics.assigned);
    const isLoading = data === undefined;
    const topics = (data ?? []) as unknown as Topic[];

    const activeTopics = topics?.slice(0, 3);

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