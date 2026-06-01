'use client'

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import ListLoading from "@/components/ui/list-loading";
import ErrorState from "@/components/ui/error-state";

import { Topic } from "../data/schema";
import { TopicStatus } from "../../topics/data/schema";
import { FeedbackModalForm } from "./my-feedback-modal-form";
import OperatorTopicCard from "./operator-topic-card";
import OperatorTopicDetail from "./operator-topic-detail";
import { toast } from "@/components/ui/sonner";

type FeedbackModalProps = {
    open: boolean;
    topicId?: string;
    topicCode?: string;
    topicStatus?: TopicStatus;
    topicName?: string;
    channels?: string[];
}

export default function OperatorFeedbacksPage() {

    const searchParams = useSearchParams();
    const autoOpenTopicId = searchParams.get('topic');

    const [searchVal, setSearchVal] = useState('');
    const [autoOpened, setAutoOpened] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
        open: false
    });

    const data = useQuery(api.topics.assigned);
    const topics = data as unknown as Topic[] | undefined;
    const isLoading = data === undefined;
    const error = null;
    const refetch = () => undefined;

    useEffect(() => {
        if (autoOpenTopicId && topics && !autoOpened) {
            const topic = topics.find(t => t.id === autoOpenTopicId);
            if (topic) {
                setSelectedTopic(topic);
            } else {
                toast.error('Topic not available');
            }
            setAutoOpened(true);
        }
    }, [autoOpenTopicId, topics, autoOpened]);

    const handleViewDetails = (topic: Topic) => {
        setSelectedTopic(topic);
    };

    const handleRespond = (topic: Topic) => {
        setSelectedTopic(null);
        setFeedbackModal({
            open: true,
            topicId: topic.id,
            topicCode: topic.topicCode,
            topicStatus: topic.status,
            topicName: topic.name,
            channels: topic.channels,
        });
    };

    const filteredTopics = useMemo(() => {
        if (!searchVal.trim()) return topics ?? [];

        const searchValue = searchVal.toLowerCase();
        return (topics ?? []).filter(topic =>
            topic.name.toLowerCase().includes(searchValue) ||
            topic.description.toLowerCase().includes(searchValue)
        );
    }, [topics, searchVal]);

    if (isLoading) return (
        <div className="px-4 space-y-4">
            <ListLoading isMobile={true} columnCount={1} rowsCount={6} />
        </div>
    );

    if (error) return (
        <div className="px-4">
            <ErrorState
                title="Oops, something went wrong!"
                message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                action={refetch} />
        </div>
    );

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="px-4 space-y-4">
                <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Your Topics
                    </h3>
                    <p className="text-body text-medium-grey">
                        Share your thoughts on the topics below
                    </p>
                </div>

                {topics && topics.length > 0 && (
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                        <Input
                            className="ps-10"
                            type="text"
                            placeholder="Search topics..."
                            value={searchVal}
                            onChange={(event) => setSearchVal(event.target.value)}
                        />
                    </div>
                )}

                {(!topics || topics.length === 0) ? (
                    <EmptyState
                        title="No topics assigned yet"
                        description="No topics have been assigned to you yet."
                        icons={[BookOpen]}
                    />
                ) : filteredTopics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No topics match your search.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTopics.map(topic => (
                            <OperatorTopicCard
                                key={topic.id}
                                topic={topic}
                                onRespond={handleRespond}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedTopic && (
                <OperatorTopicDetail
                    topic={selectedTopic}
                    open={!!selectedTopic}
                    onClose={() => setSelectedTopic(null)}
                    onRespond={() => handleRespond(selectedTopic)}
                />
            )}

            {feedbackModal.open && (
                <FeedbackModalForm
                    topicId={feedbackModal.topicId!}
                    topicChannels={feedbackModal.channels!}
                    topicCode={feedbackModal.topicCode!}
                    topicStatus={feedbackModal.topicStatus!}
                    topicTitle={feedbackModal.topicName!}
                    open={feedbackModal.open}
                    onClose={() => setFeedbackModal({ open: false })}
                />
            )}
        </main>
    );
}
