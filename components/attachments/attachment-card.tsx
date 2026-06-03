import { Download, Eye, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { formatDate } from "@/utils/helpers/helpers";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { KnowledgeStatus } from "./knowledge-status";
import Image from "next/image";

export interface AttachmentData {
    id: string;
    url: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    contentType: string;
    contentHash: string;
    createdAt: string;
    createdBy: string;
    parseStatus?: string;
}


export default function AttachmentCard({ attachment, onPreview }: { attachment: AttachmentData; onPreview?: () => void }) {

    const isPreviewable = attachment.contentType.startsWith("image/") || attachment.contentType === "application/pdf";
    const reparse = useMutation(api.ingestion.reparse);

    const downloadAttachment = () => {
        const link = document.createElement("a");
        link.href = attachment.url;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex gap-2 items-center rounded-md bg-muted/40 p-2">
            {
                attachment.contentType.startsWith("image/")
                    ? (
                        <div
                            className={`relative min-w-12 w-12 min-h-12 h-12 border border-secondary rounded-lg overflow-hidden ${isPreviewable && onPreview ? "cursor-pointer" : ""}`}
                            onClick={isPreviewable && onPreview ? onPreview : undefined}
                        >
                            <Image
                                src={attachment.url}
                                alt={attachment.fileName}
                                fill
                                sizes="40px"
                                className="object-contain"
                                quality={50}
                            />
                        </div>
                    ) : (
                        <FileText
                            className={`w-12 h-12 text-destructive ${isPreviewable && onPreview ? "cursor-pointer" : ""}`}
                            onClick={isPreviewable && onPreview ? onPreview : undefined}
                        />
                    )
            }
            <div className="flex flex-1 gap-2 min-w-0">
                <div className="flex flex-col min-w-0 flex-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="font-semibold line-clamp-1 truncate">
                                {attachment.fileName}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {attachment.fileName}
                        </TooltipContent>
                    </Tooltip>
                    <div className="text-xs">
                        {((attachment.fileSize ?? 0) / (1024 * 1024)).toFixed(2)} MB • Uploaded by {attachment.createdBy} on {formatDate(attachment.createdAt)}
                    </div>
                    {attachment.parseStatus &&
                        <div className="mt-1">
                            <KnowledgeStatus
                                status={attachment.parseStatus}
                                onRetry={() => reparse({ fileId: attachment.id as Id<"files"> })}
                            />
                        </div>
                    }
                </div>
                <div className="flex-shrink-0 flex items-center">
                    {isPreviewable && onPreview && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={onPreview}>
                                    <Eye />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span className="text-xs">Preview</span>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={() => { downloadAttachment() }}>
                                <Download />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <span className="text-xs">Download</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}