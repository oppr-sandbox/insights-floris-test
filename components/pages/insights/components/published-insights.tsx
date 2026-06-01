'use client';

import { DataTable } from "@/components/data-table/data-table";
import { Insight, PublishedInsight } from "../data/schema";
import { publishedInsightsColumns } from "./columns";
import { Row } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import InsightItem from "./insight-item";
import ListLoading from "@/components/ui/list-loading";
import ErrorState from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart } from "lucide-react";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function PublishedInsights() {

    const router = useRouter();
    const isMobile = useIsMobile();
    const { tenant } = useUserDetails();

    const data = useQuery(api.insights.published);
    const insights = (data ?? []) as unknown as Insight[];
    const isLoading = data === undefined;
    const error = null;
    const refetch = () => undefined;

    if (isLoading) return (
        <ListLoading
            isMobile={isMobile}
            columnCount={publishedInsightsColumns.length}
            rowsCount={15} />
    );

    if (error) return (
        <div>
            <ErrorState
                title="Oops, something went wrong!"
                message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                action={refetch} />
        </div>
    );

    if (!insights?.length) return (
        <EmptyState
            title="No Insights Published"
            description="Start by publishing your draft insights"
            icons={[BarChart]}
        />
    )

    const handleRowClick = (row: PublishedInsight) => {
        router.push(`/${tenant}/insights/${row.insightCode}`)
    }

    const renderList = () => {
        if (isMobile) {
            return (
                <div className="flex flex-col space-y-4">
                    {insights.map(t => <InsightItem isPublished={true} key={t.id} insight={t} onClick={handleRowClick} />)}
                </div>
            )
        }
        else {
            return (
                <DataTable data={insights} columns={publishedInsightsColumns} onRowClick={(row) => handleRowClick(row.original)} />
            )
        }
    }

    return renderList()
}