"use client"

import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";

export default function Loading() {
    const searchParams = useSearchParams()
    const currentTab =
        ["statistics", "contents", "feedbacks", "exports"].find((key) =>
            searchParams.has(key)
        ) || "statistics";

    const renderTabSkeletons = () => {
        switch (currentTab) {
            case "statistics":
                return (
                    <>
                        <Skeleton className="h-50 w-full bg-secondary/50" />
                        <Skeleton className="h-70 w-full bg-secondary/50" />
                        <Skeleton className="flex-1 min-h-50 w-full bg-secondary/50" />
                    </>
                );
            case "contents":
                return (
                    <>
                        <Skeleton className="h-100 w-full bg-secondary/50" />
                        <Skeleton className="flex-1 w-full bg-secondary/50" />
                    </>
                );
            case "feedbacks":
                return (
                    <>
                        <Skeleton className="flex-1 w-full bg-secondary/50" />
                        <Skeleton className="flex-1 w-full bg-secondary/50" />
                        <Skeleton className="flex-1 w-full bg-secondary/50" />
                        <Skeleton className="flex-1 w-full bg-secondary/50" />
                    </>
                );
            case "exports":
                return (
                    <Skeleton className="flex-1 w-full bg-secondary/50" />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 px-4 pt-2">
            {/* Header */}
            <div className="flex flex-row justify-between items-center gap-4">
                <div className="flex flex-5 flex-col min-w-0 gap-2">
                    <div className="flex gap-2 items-center">
                        <Skeleton className="h-4 w-30 bg-secondary/50" />
                        <Skeleton className="h-4 w-12 bg-secondary/50" />
                    </div>
                    <Skeleton className="h-5 w-150 bg-secondary/50" />
                </div>
                {/* Button Group */}
                <div className="flex flex-1 flex-row items-center justify-end gap-2">
                    <Skeleton className="h-8 w-15 bg-secondary/50" />
                    <Skeleton className="h-8 w-15 bg-secondary/50" />
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 h-full">
                <Skeleton className="h-10 w-full bg-secondary/50" />
                <div className="flex flex-1 flex-col gap-5">{renderTabSkeletons()}</div>
            </div>
        </div>
    );
}
