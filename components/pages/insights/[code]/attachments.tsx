'use client'

import AttachmentCard from "@/components/attachments/attachment-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TopicContents } from "../../topics/data/schema";
import { File, Image } from "lucide-react";
import ErrorState from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function Attachments ({ topicId } : { topicId: string }) {

    const data = useQuery(
        api.topics.contents,
        topicId ? { id: topicId as Id<"topics"> } : "skip"
    );
    const contents = data as unknown as TopicContents | undefined;
    const contentsIsLoading = data === undefined;
    const contentsError = null;
    const refetch = () => undefined;

    if (contentsIsLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-20 w-full bg-secondary/50" />
                        <Skeleton className="h-20 w-full bg-secondary/50" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (contentsError) {
        return (
            <Card className="p-4 text-red-600">
                <CardContent>
                    <ErrorState
                        title="Oops, something went wrong!" 
                        message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                        action={refetch} />
                </CardContent>
            </Card>
        )
    }

    if (!contents || !contents.attachments?.length) {
        return (
            <EmptyState
                title="No Uploaded Attachments"
                description="No files have been added to this document."
                icons={[Image, File ]}
            />
        )
    }

    return (
        <Card className="py-5 px-1 gap-2">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                    <File /><span className="text-lg">Uploaded Files ({contents.attachments?.length ?? 0})</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contents && contents.attachments?.map((file) => {
                    return (<AttachmentCard key={file.id} attachment={file} />)
                })}
            </CardContent>
        </Card>
    )
}