'use client';

import { DataTable } from "@/components/data-table/data-table";
import { Insight } from "../data/schema";
import { allInsightsColumns } from "./columns";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import InsightItem from "./insight-item";
import ErrorState from "@/components/ui/error-state";
import ListLoading from "@/components/ui/list-loading";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart } from "lucide-react";
import { useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useUserDetails } from "@/providers/UserContextProvider";
import { useInsightList } from "../hooks/useInsightList";

export default function AllInsights() {

    const router = useRouter();
    const isMobile = useIsMobile();
    const { user, tenant, hasPermission } = useUserDetails();
    const { insights, error, isLoading, refetch: refetch } = useInsightList();

    const { subscribe, unsubscribe, connectionState } = useNotification();

    useEffect(() => {
        if (connectionState === 'Connected') {
            const handleNotification = (
                _topic: string
            ) => {
                refetch()
            };

            subscribe("insights-generation-completed-" + user.companyId, handleNotification);

            return () => unsubscribe("insights-generation-completed-" + user.companyId);
        }
    }, [connectionState, refetch]);

    if (isLoading) return (
        <ListLoading
            isMobile={isMobile}
            columnCount={allInsightsColumns.length}
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
            title="No Insights Generated"
            description="Start generating insight by clicking new insight"
            icons={[BarChart]}
        />
    )

    const tableColumns = hasPermission('insights:manage')
        ? allInsightsColumns : allInsightsColumns.filter(column => column.id !== 'actions');

    const handleRowClick = (row: Insight) => {
        router.push(`/${tenant}/insights/${row.insightCode}`)
    }

    const renderList = () => {
        if (isMobile) {
            return (
                <div className="flex flex-col space-y-4">
                    {insights.map(t => <InsightItem key={t.id} insight={t} onClick={handleRowClick} />)}
                </div>
            )
        }
        else {
            return (
                <DataTable data={insights} columns={tableColumns} onRowClick={(row) => handleRowClick(row.original)} />
            )
        }
    }

    return renderList()
}