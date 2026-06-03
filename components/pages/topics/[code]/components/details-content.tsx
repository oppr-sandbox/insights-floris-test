'use client'

import { TabsContent } from "@/components/ui/tabs";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { SerializedEditorState, SerializedLexicalNode, SerializedRootNode } from "lexical";
import { ReadonlyEditor } from "@/components/editor/blocks/readonly-editor/editor";
import { File, Type, Text, FileText } from "lucide-react";
import AttachmentCard, { AttachmentData } from "@/components/attachments/attachment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageCarouselModal } from "@/components/attachments/attachment-preview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const PdfViewerModal = dynamic(() => import("@/components/attachments/pdf-viewer-modal"), { ssr: false });

export default function Contents() {

    const { data } = useTopicDetail();

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageJumpTo, setImageJumpTo] = useState(0);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<AttachmentData | null>(null);

    const imageAttachments = useMemo(
        () => (data?.topicAttachments ?? []).filter((a) => a.contentType.startsWith("image/")),
        [data?.topicAttachments]
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
            if (data) {

                let serializedState: SerializedEditorState | undefined = undefined;

                if (typeof data.content === "string" && data.content.trim() !== "") {
                    serializedState = JSON.parse(data.content) as SerializedEditorState;
                }
                else {
                    serializedState = data.content as SerializedEditorState | undefined;
                }

                if (serializedState) {
                    const isEmpty = serializedState.root.children.length === 0 ||
                        serializedState.root.children
                            .flatMap(c => (c as SerializedRootNode<SerializedLexicalNode>).children).length === 0;

                    if (isEmpty)
                        return undefined;
                }

                return serializedState;
            }
            else {
                return undefined;
            }
        } catch {
            return undefined;
        }
    }, [data]);

    return (
        <TabsContent value="contents">
            <div className="flex flex-col gap-4">
                <Card className="py-5 px-1 gap-2">
                    <CardContent className="flex flex-col flex-1 gap-2">
                        <h3 className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                            <FileText className="size-4" /><span>Description</span>
                        </h3>
                        <div className="text-dark-grey">
                            <p className="text-body text-dark-grey leading-relaxed whitespace-pre-wrap">{data!.description}</p>
                        </div>

                        <h3 className="flex items-center gap-1 text-sm font-semibold text-muted-foreground mt-4">
                            <Text className="size-4" /><span>Content</span>
                        </h3>
                        {
                            content ? (
                                <ReadonlyEditor
                                    editorSerializedState={content}
                                    className="overflow-auto" />
                            ) : (
                                <EmptyState
                                    title="No Content"
                                    description="No content has been added yet for this topic."
                                    icons={[Type]}
                                />
                            )
                        }
                    </CardContent>
                </Card>
                {((data!.topicAttachments?.length ?? 0) > 0) &&
                    <Card className="py-5 px-1 gap-2">
                        <CardHeader>
                            <CardTitle className="flex gap-2 items-center">
                                <File /><span className="text-lg">Uploaded Files ({data!.topicAttachments?.length ?? 0})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 xl:grid-cols-3  gap-4">
                            {data!.topicAttachments?.map((file) => {
                                return (<AttachmentCard key={file.id} attachment={file} onPreview={() => handlePreview(file)} />)
                            })}
                        </CardContent>
                    </Card>
                }
            </div>

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
        </TabsContent>
    )
}
