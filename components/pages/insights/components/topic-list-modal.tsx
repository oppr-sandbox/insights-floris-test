'use client';

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { columns } from "./topic-list-columns";
import { CompletedTopic } from "../data/schema";
import { Row } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TopicItem from "./topic-item";
import { EmptyState } from "@/components/ui/empty-state";
import posthog from "posthog-js";

export default function TopicListModal(
    {
        open,
        setOpen
    }: {
        open: boolean,
        setOpen: (value: boolean) => void;
    }
) {

    const queryClient = useQueryClient();
    const httpClient = createHttpClient();
    const isMobile = useIsMobile();

    const [selectedTopicId, setSelectedTopicId] = useState<string>();
    const [searchVal, setSearchVal] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: topics, error, isLoading } = useQuery<CompletedTopic[]>({
        queryKey: ['completed-topics'],
        queryFn: () => httpClient.get('/api/topics/completed'),
        enabled: open
    });

    const { isPending: isSubmitting, mutateAsync: generateAsync } = useMutation({
        mutationFn: (data: any) => httpClient.post(`/api/insights/${data.id}/generate`, {}),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message);
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        },
        onSuccess: () => {
            posthog.capture('insight_generation_started', { topic_id: selectedTopicId });
            toast.success('Topic insights generation has started', { description: 'Will let you know once the generation is done.' });
        }
    });

    const handlefilterBy = (topic: CompletedTopic) => {
        // --- Search Match ---
        const searchMatch = searchVal?.trim()
            ? (() => {
                const searchValue = searchVal.toLowerCase();
                return (
                    topic.topicCode.toLowerCase().includes(searchValue) ||
                    topic.topicName.toLowerCase().includes(searchValue)
                );
            })()
            : true;

        // --- Status Match ---
        const statusCheckers: Record<string, (topic: CompletedTopic) => boolean> = {
            all: () => true,
            active: (topic) => topic.status === 'ACTIVE',
            completed: (topic) => topic.status === 'COMPLETED',
        };
        const statusMatch = statusCheckers[statusFilter]?.(topic) ?? true;

        return searchMatch && statusMatch;
    }

    const filteredTopics = topics?.filter(handlefilterBy)

    const handleRowClicked = async (row: Row<CompletedTopic>) => {
        row.toggleSelected()

        if (!row.getIsSelected()) {
            setSelectedTopicId(row.original.id);
        } else {
            setSelectedTopicId('');
        }
    }

    const handleTopicItemClicked = (topic: CompletedTopic) => {
        const isSelected = selectedTopicId === topic.id;

        if (!isSelected) {
            setSelectedTopicId(topic.id);
        } else {
            setSelectedTopicId('');
        }
    }

    const handleGenerateClicked = async () => {
        await generateAsync({ id: selectedTopicId })
        queryClient.invalidateQueries({ queryKey: ['insights'] })
        setOpen(false);
    }

    const renderList = () => {
        if (isMobile) {
            return (
                <>
                    {filteredTopics && filteredTopics.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {filteredTopics?.map(topic =>
                                <TopicItem
                                    key={topic.id}
                                    topic={topic}
                                    isSelected={topic.id === selectedTopicId}
                                    onClick={handleTopicItemClicked}
                                />
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            title="No Topics Found"
                            description="There are no topics to generate insights from."
                            className="p-10"
                            icons={[BookOpen]}
                        />
                    )}
                </>
            )
        }

        return (
            <DataTable
                data={filteredTopics || []}
                columns={columns}
                onRowClick={handleRowClicked}
            />
        )
    }

    useEffect(() => {
        if (open)
            setSelectedTopicId(undefined);
    }, [open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[calc(100%-2rem)] lg:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Select a Topic to Analyze</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col max-w-[24rem] lg:max-w-full lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex w-full flex-col lg:flex-row gap-4">
                        <div className="relative w-full lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                            <Input
                                className="ps-10"
                                type="text"
                                placeholder="Search topics..."
                                value={searchVal}
                                onChange={(event) => { setSearchVal(event.target.value); }} />
                        </div>
                        <ToggleGroup
                            onValueChange={(value) => setStatusFilter(value)}
                            value={statusFilter}
                            variant="outline"
                            type="single"
                            className="w-full lg:max-w-md">
                            <ToggleGroupItem value="all" className="w-full">
                                All
                            </ToggleGroupItem>
                            <ToggleGroupItem value="active" className="w-full">
                                Active
                            </ToggleGroupItem>
                            <ToggleGroupItem value="completed" className="w-full">
                                Completed
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
                <ScrollArea className="max-h-[70vh]">
                    {renderList()}
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <ConfirmationDialog
                        title="Confirm Action"
                        description="Are you sure you want to generate insights for the selected topic?"
                        triggerButton={
                            <Button disabled={!selectedTopicId || isSubmitting}>
                                Generate
                            </Button>
                        }
                        actionButtonText="Confirm"
                        onActionButtonClicked={handleGenerateClicked}>
                    </ConfirmationDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

}