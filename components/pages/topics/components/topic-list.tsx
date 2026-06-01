'use client';

import { BookOpen } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";

import TopicItem from "./topic-item";
import { columns } from "./columns";
import TopicLoading from "./topic-loading";
import ConfirmationArchiveDialog from "./confirm-archive";
import ConfirmationDeleteDialog from "./confirm-delete";

import { TopicListProvider, useTopicList } from "./hooks/useTopicList";
import ConfirmationPauseDialog from "./confirm-pause";
import ConfirmationPublishDialog from "./confirm-publish";
import { useUserDetails } from "@/providers/UserContextProvider";
import ConfirmationGenerateInsightDialog from "./confirm-generate-insight";

const List = ({ onCreateTopicClick }: { onCreateTopicClick: () => void }) => {

    const { hasPermission } = useUserDetails();
    const {
        topics,
        totalRowCount,
        pageSize,
        isLoading,
        isFetching,
        error,
        view,
        handleRefetch,
        handleRowClick
    } = useTopicList();

    if (isLoading) return (
        <TopicLoading view={view} columnCount={columns.length} rowsCount={pageSize} />
    );

    if (error) return (
        <div>
            <ErrorState
                title="Oops, something went wrong!"
                message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                action={handleRefetch} />
        </div>
    );

    if (!topics || !topics.length) return (
        <EmptyState
            title="No Topics"
            description="Create a topic and gather feedbacks."
            icons={[BookOpen]}
            action={{
                label: "Create Topic",
                onClick: onCreateTopicClick
            }}
        />
    )

    const tableColumns = hasPermission('topics:manage')
        ? columns : columns.filter(column => column.id !== 'actions');

    return (
        <>
            <TabsContent value="cards" className="mb-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {topics.map(t => <TopicItem key={t.id} topic={t} />)}
                </div>
                {
                    isLoading && isFetching && (
                        <div className="flex flex-1 justify-center py-4 items-center">
                            <Spinner />
                        </div>
                    )
                }
            </TabsContent>
            <TabsContent value="table">
                <DataTable
                    data={topics}
                    columns={tableColumns}
                    rowCount={totalRowCount}
                    enablePagination={false}
                    onRowClick={handleRowClick} />
                {
                    isLoading && isFetching && (
                        <div className="flex flex-1 justify-center py-4 items-center">
                            <Spinner />
                        </div>
                    )
                }
            </TabsContent>
        </>
    )
};

export default function TopicList({ onCreateTopicClick }: { onCreateTopicClick: () => void }) {
    return (
        <TopicListProvider>
            <List onCreateTopicClick={onCreateTopicClick} />
            <ConfirmationArchiveDialog />
            <ConfirmationDeleteDialog />
            <ConfirmationPauseDialog />
            <ConfirmationPublishDialog />
            <ConfirmationGenerateInsightDialog />
        </TopicListProvider>
    )
}