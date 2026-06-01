'use client';

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { createHttpClient } from "@/utils/api/createHttpClient";

import { BookOpen } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import ErrorState from "@/components/ui/error-state";
import ListLoading from "@/components/ui/list-loading";
import { EmptyState } from "@/components/ui/empty-state";

import { Topic } from "../data/schema";
import { columns } from "./assigned-topics-columns";
import { FeedbackModalForm } from "./my-feedback-modal-form";
import { TopicStatus } from "../../topics/data/schema";
import AssignedTopicItem from "./assigned-topic-item";
import { toast } from "@/components/ui/sonner";

type FeedbackModalProps = {
    open: boolean;
    id?: string;
    topicId?: string;
    topicCode?: string;
    topicStatus?: TopicStatus;
    topicName?: string;
    channels?: string[];
}

export default function AssignedTopics({ searchVal, autoOpenTopicId }: { searchVal?: string; autoOpenTopicId?: string }) {

    const isMobile = useIsMobile();
    const httpClient = createHttpClient();
    const [autoOpened, setAutoOpened] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
        open: false
    });

    const { data: topics, error, isLoading, refetch } = useQuery<Topic[]>({
        queryKey: ['assigned-topics'],
        queryFn: () => httpClient.get('/api/topics/assigned')
    });

    useEffect(() => {
        if (autoOpenTopicId && topics && !autoOpened) {
            const topic = topics.find(t => t.id === autoOpenTopicId);
            if (topic) {
                setFeedbackModal({
                    open: true,
                    topicId: topic.id,
                    topicCode: topic.topicCode,
                    topicStatus: topic.status,
                    topicName: topic.name,
                    channels: topic.channels,
                });
            } else {
                toast.error('Topic not available');
            }
            setAutoOpened(true);
        }
    }, [autoOpenTopicId, topics, autoOpened]);

    const handleRowClicked = (topic: Topic) => {
        setFeedbackModal({
            open: true,
            topicId: topic.id,
            topicCode: topic.topicCode,
            topicStatus: topic.status,
            topicName: topic.name,
            channels: topic.channels,
        })
    }

    const filteredTopics = useMemo(() => {
        const filterBySearch = (topic: Topic) => {
            let keywordMatch = true;
            if (searchVal && searchVal.trim() !== '') {
                const searchValue = searchVal.toLowerCase();
                keywordMatch =
                    topic.topicCode.toLowerCase().includes(searchValue) ||
                    topic.name.toLowerCase().includes(searchValue) ||
                    topic.description.toLowerCase().includes(searchValue);
            }

            return keywordMatch;
        }

        return topics?.filter(filterBySearch) ?? [];
    }, [topics, searchVal]);

    if (isLoading) return (
        <ListLoading
            isMobile={isMobile}
            columnCount={columns.length}
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

    if (!topics || (!topics.length && !searchVal)) return (
        <EmptyState
            title="No Assigned Topics"
            description="There are no topics created yet."
            icons={[BookOpen]}
        />
    )

    const renderList = () => {
        if (isMobile) {
            return (
                <div className="flex flex-col space-y-4">
                    {topics.map(t => <AssignedTopicItem key={t.id} topic={t} onClick={handleRowClicked} />)}
                </div>
            )
        }
        else {
            return (
                <DataTable data={filteredTopics} columns={columns} onRowClick={row => handleRowClicked(row.original)} />
            )
        }
    }

    return (
        <>
            {renderList()}
            {
                feedbackModal.open && (
                    <FeedbackModalForm
                        feedbackId={feedbackModal.id}
                        topicId={feedbackModal.topicId!}
                        topicChannels={feedbackModal.channels!}
                        topicCode={feedbackModal.topicCode!}
                        topicStatus={feedbackModal.topicStatus!}
                        topicTitle={feedbackModal.topicName!}
                        open={feedbackModal?.open}
                        onClose={() => setFeedbackModal({ open: false })}
                    />
                )
            }
        </>
    )
}
