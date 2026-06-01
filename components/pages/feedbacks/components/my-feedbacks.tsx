'use client';

import { useMemo, useState } from "react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useIsMobile } from "@/hooks/use-mobile";

import { Image, Mic, Text } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import ListLoading from "@/components/ui/list-loading";
import ErrorState from "@/components/ui/error-state";

import { Feedback } from "../data/schema";
import { columns } from "./my-feedbacks-columns";
import { FeedbackModalForm } from "./my-feedback-modal-form";
import { TopicStatus } from "../../topics/data/schema";
import FeedbackItem from "./feedback-item";

type FeedbackModalProps = {
    open: boolean;
    id?: string;
    topicId?: string;
    topicCode?: string;
    topicStatus?: TopicStatus;
    topicName?: string;
    channels?: string[];
}

export default function MyFeedbacks({ searchVal, showCompleted }: { searchVal?: string; showCompleted: boolean }) {

    const isMobile = useIsMobile();

    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
        open: false
    });

    const data = useQuery(api.feedback.myFeedbacks, { showCompleted });
    const feedbacks = data as unknown as Feedback[] | undefined;
    const isLoading = data === undefined;
    const error = null;
    const refetch = () => undefined;

    const handleRowClicked = (feedback: Feedback) => {
        setFeedbackModal({
            open: true,
            id: feedback.id,
            topicId: feedback.topicId,
            topicCode: feedback.topicCode,
            topicStatus: feedback.topicStatus,
            topicName: feedback.topicName,
            channels: feedback.channels,
        })
    }

    const filteredFeedbacks = useMemo(() => {
        const filterBySearch = (feedback: Feedback) => {
            let keywordMatch = true;
            if (searchVal && searchVal.trim() !== '') {
                const searchValue = searchVal.toLowerCase();
                keywordMatch =
                    feedback.topicCode.toLowerCase().includes(searchValue) ||
                    feedback.topicName.toLowerCase().includes(searchValue) ||
                    feedback.feedbackCode.toLowerCase().includes(searchValue);
            }

            return keywordMatch;
        }

        return feedbacks?.filter(filterBySearch) ?? [];
    }, [feedbacks, searchVal]);

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

    if (!feedbacks || (!feedbacks.length && !searchVal)) return (
        <EmptyState
            title="No Submitted Feedbacks"
            description="Start submitting feedbacks by navigating to assigned topics tab"
            icons={[Image, Mic, Text]}
        />
    )

    const renderList = () => {
        if (isMobile) {
            return (
                <div className="flex flex-col space-y-4">
                    {filteredFeedbacks.map(t => (
                        <FeedbackItem
                            key={t.id}
                            feedback={t}
                            onClick={handleRowClicked}
                        />
                    ))}
                </div>
            )
        }
        else {
            return (
                <DataTable data={filteredFeedbacks} columns={columns} onRowClick={(row) => handleRowClicked(row.original)} />
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
