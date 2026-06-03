'use client'

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SerializedEditorState, SerializedLexicalNode, SerializedRootNode } from "lexical";

import { cn } from "@/lib/utils";
import { remainingDays } from "@/utils/helpers/helpers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { ReadonlyEditor } from "@/components/editor/blocks/readonly-editor/editor";
import AttachmentCard, { AttachmentData } from "@/components/attachments/attachment-card";
import { ImageCarouselModal } from "@/components/attachments/attachment-preview";

import { Topic } from "../data/schema";
import { channels } from "../../topics/data/data";
import { Clock, File, FileText, Send, Text } from "lucide-react";

const PdfViewerModal = dynamic(() => import("@/components/attachments/pdf-viewer-modal"), { ssr: false });

type TopicDetail = {
    id: string;
    topicCode: string;
    name: string;
    description: string;
    content: string;
    channels: string[];
    status: string;
    startDate: string;
    endDate: string;
    topicAttachments: AttachmentData[];
}

interface OperatorTopicDetailProps {
    topic: Topic;
    open: boolean;
    onClose: () => void;
    onRespond: () => void;
}

export default function OperatorTopicDetail({ topic, open, onClose, onRespond }: OperatorTopicDetailProps) {

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageJumpTo, setImageJumpTo] = useState(0);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<AttachmentData | null>(null);

    const data = useQuery(api.topics.getByCode, open ? { code: topic.topicCode } : "skip");
    const topicDetail = data as unknown as TopicDetail | undefined;
    const isLoading = data === undefined;

    const hasResponded = topic.myFeedbacksCount > 0;
    const daysLeft = remainingDays(topic.endDate);

    const imageAttachments = useMemo(
        () => (topicDetail?.topicAttachments ?? []).filter((a) => a.contentType.startsWith("image/")),
        [topicDetail?.topicAttachments]
    );

    const handlePreview = (attachment: AttachmentData) => {
        if (attachment.contentType.startsWith("image/")) {
            const index = imageAttachments.findIndex((a) => a.id === attachment.id);
            setImageJumpTo(index >= 0 ? index : 0);
            setImageDialogOpen(true);
        } else if (attachment.contentType === "application/pdf") {
            setSelectedPdf(attachment);
            setPdfDialogOpen(true);
        }
    };

    const content = useMemo(() => {
        try {
            if (!topicDetail?.content) return undefined;

            let serializedState: SerializedEditorState | undefined;

            if (typeof topicDetail.content === "string" && topicDetail.content.trim() !== "") {
                serializedState = JSON.parse(topicDetail.content) as SerializedEditorState;
            } else {
                serializedState = topicDetail.content as unknown as SerializedEditorState | undefined;
            }

            if (serializedState) {
                const isEmpty = serializedState.root.children.length === 0 ||
                    serializedState.root.children
                        .flatMap(c => (c as SerializedRootNode<SerializedLexicalNode>).children).length === 0;
                if (isEmpty) return undefined;
            }

            return serializedState;
        } catch {
            return undefined;
        }
    }, [topicDetail?.content]);

    const daysLeftColor = daysLeft !== null
        ? daysLeft > 5
            ? "text-success-foreground"
            : daysLeft > 2
                ? "text-warning-foreground"
                : "text-destructive-foreground"
        : "";

    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
                <DialogContent className="flex flex-col rounded-none border-none h-full max-h-full max-w-full md:rounded-lg md:border md:h-auto md:max-h-[90vh] md:max-w-2xl">
                    <DialogHeader>
                        <DialogDescription className="text-left">Your feedback is requested</DialogDescription>
                        <DialogTitle className="text-left text-xl">{topic.name}</DialogTitle>
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex space-x-1.5">
                                {topic.channels.map(p => {
                                    const channel = channels[p];
                                    return (
                                        <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")}>
                                            <channel.icon className={cn("size-3.5", "text-" + channel.color)} />
                                        </div>
                                    );
                                })}
                            </div>
                            {daysLeft !== null && (
                                <div className="flex items-center gap-1">
                                    <Clock className="size-3.5 text-muted-foreground" />
                                    <span className={cn("text-xs font-medium", daysLeftColor)}>
                                        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                    </span>
                                </div>
                            )}
                            {hasResponded
                                ? <Badge color="success" variant="outline">Submitted</Badge>
                                : <Badge color="default" variant="outline">Pending</Badge>
                            }
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="max-h-[65vh]">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 pr-3">
                                    {topicDetail?.description && (
                                        <div>
                                            <h3 className="flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-2">
                                                <FileText className="size-4" /><span>Description</span>
                                            </h3>
                                            <p className="text-body leading-relaxed whitespace-pre-wrap">
                                                {topicDetail.description}
                                            </p>
                                        </div>
                                    )}

                                    {content && (
                                        <div>
                                            <h3 className="flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-2">
                                                <Text className="size-4" /><span>Content</span>
                                            </h3>
                                            <ReadonlyEditor
                                                editorSerializedState={content}
                                                className="overflow-auto"
                                            />
                                        </div>
                                    )}

                                    {(topicDetail?.topicAttachments?.length ?? 0) > 0 && (
                                        <div>
                                            <h3 className="flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-2">
                                                <File className="size-4" />
                                                <span>Files ({topicDetail!.topicAttachments.length})</span>
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {topicDetail!.topicAttachments.map((file) => (
                                                    <AttachmentCard
                                                        key={file.id}
                                                        attachment={file}
                                                        onPreview={() => handlePreview(file)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!topicDetail?.description && !content && (topicDetail?.topicAttachments?.length ?? 0) === 0 && !isLoading && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No additional details provided for this topic.
                                        </p>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button onClick={onRespond}>
                            {hasResponded ? 'View Response' : <><Send className="size-4" /> Respond</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="max-w-fit p-6">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Preview</DialogTitle>
                        <DialogDescription>Preview attached images</DialogDescription>
                    </DialogHeader>
                    <ImageCarouselModal images={imageAttachments} jumpTo={imageJumpTo} />
                </DialogContent>
            </Dialog>

            <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-6">
                    <DialogHeader>
                        <DialogTitle className="truncate">{selectedPdf?.fileName}</DialogTitle>
                        <DialogDescription className="sr-only">PDF document preview</DialogDescription>
                    </DialogHeader>
                    {selectedPdf && <PdfViewerModal url={selectedPdf.url} fileName={selectedPdf.fileName} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
