import { formatDateTime } from "@/utils/helpers/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { ImageCarouselModal, ImageCarouselThumbnail } from "../attachments/attachment-preview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { cn, getAvatarUrl } from "@/lib/utils";
import { ChannelBadge } from "../channels/channels-badge";
import { TopicChannels } from "../pages/topics/data/schema";
import { Spinner } from "../ui/spinner";
import { Translation, useFeedbackItem } from "./hooks/useFeedbackItem";
import { WaveformPlayer } from "./waveform-player";

export type SentimentValues = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

type BadgeColor = {
    value: string;
    color: 'default' | 'secondary' | 'success' | 'tertiary' | 'warning' | 'destructive';
}

export const sentimentBadge: Record<SentimentValues, BadgeColor> = {
    ['POSITIVE']: {
        value: "Positive",
        color: "success"
    },
    ['NEUTRAL']: {
        value: "Neutral",
        color: "warning",
    },
    ['NEGATIVE']: {
        value: "Negative",
        color: "destructive"
    },
};

const sentimentAccent: Record<SentimentValues, string> = {
    ['POSITIVE']: "border-l-success",
    ['NEUTRAL']: "border-l-warning",
    ['NEGATIVE']: "border-l-destructive",
};

export type FeedbackItemProps = {
    id: string;
    sentiment?: SentimentValues;
    submittedBy: {
        image: string;
        name: string;
        initials: string;
        position: string;
        role?: string;
    }
    dateSubmitted: string;
    text?: string;
    textLangCode?: string;
    audio?: {
        url: string;
        transcribedText: string;
        transcribedTextLangCode?: string;
    }
    images?: {
        url: string;

    }[]
}

function FeedbacksSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full bg-secondary/50" />
            <Skeleton className="h-20 w-full bg-secondary/50" />
            <Skeleton className="h-20 w-full bg-secondary/50" />
            <Skeleton className="h-20 w-full bg-secondary/50" />
        </div>
    )
}

function FeedbackTranslation({
    text,
    langCode,
    showTranslation,
    isTranscript,
}: {
    text: Translation,
    langCode: string,
    showTranslation: boolean,
    isTranscript?: boolean,
}) {
    return (
        <div>
            <a
                href="#"
                className={`text-xs ${!isTranscript ? 'px-4' : ''} font-medium`}
                onClick={(e) => {
                    e.preventDefault();
                    text.handleShowTranslation();
                }}>
                {
                    showTranslation && !text.isTranslating
                        ? `Translated from ${new Intl.DisplayNames(["en"], { type: "language" }).of(langCode)} by Gemini`
                        : `Translate${isTranscript ? ' transcription' : ''} using AI`
                }
            </a>
            <div className="flex flex-col items-center">
                {text.isTranslating ? (
                    <Spinner className="my-4" />
                ) : (
                    showTranslation &&
                    text.translation && (
                        <div className={`py-2 ${isTranscript ? 'italic' : 'mx-4'}`}>
                            {text.translation}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function FeedbackItem({ feedback }: { feedback: FeedbackItemProps }) {
    const {
        text,
        showText,
        transcript,
        showTranscript,
    } = useFeedbackItem(feedback);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentImgIdx, setCurrentImgIdx] = useState(0);

    return (
        <div className={cn(
            "rounded-lg border border-l-4 border-border-grey bg-muted/25 p-4",
            feedback.sentiment ? sentimentAccent[feedback.sentiment] : "border-l-border-grey",
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={getAvatarUrl(feedback.submittedBy.image, 'x32')} alt={feedback.submittedBy.name} />
                        <AvatarFallback className="text-sm">{feedback.submittedBy.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold leading-tight truncate">{feedback.submittedBy.name}</span>
                            {feedback.submittedBy.role &&
                                <span className="text-xs text-muted-foreground rounded-sm bg-muted px-1.5 py-0.5">
                                    {feedback.submittedBy.role}
                                </span>
                            }
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDateTime(feedback.dateSubmitted)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {feedback.text && <ChannelBadge channel={TopicChannels.Text} />}
                    {feedback.audio && <ChannelBadge channel={TopicChannels.Voice} />}
                    {feedback.images && <ChannelBadge channel={TopicChannels.Image} />}
                </div>
            </div>

            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start">
                <div className="min-w-0 flex-1 space-y-3">
                    {feedback.text &&
                        <div className="space-y-1">
                            <p className="max-w-prose text-sm leading-relaxed">
                                {feedback.text}
                            </p>
                            {feedback.textLangCode && !feedback.textLangCode.startsWith('en') &&
                                <FeedbackTranslation
                                    text={text}
                                    langCode={feedback.textLangCode}
                                    showTranslation={showText} />
                            }
                        </div>
                    }
                    {feedback.audio &&
                        <div className="space-y-1">
                            <div className="max-w-prose flex flex-col space-y-2 px-4 py-2 border-l-4 border-muted-foreground/50 bg-muted/50 rounded-r-md">
                                <div className="text-sm italic">
                                    "{feedback.audio.transcribedText}"
                                </div>
                                {feedback.audio.transcribedTextLangCode && !feedback.audio.transcribedTextLangCode.startsWith('en') &&
                                    <FeedbackTranslation
                                        text={transcript}
                                        langCode={feedback.audio.transcribedTextLangCode}
                                        showTranslation={showTranscript}
                                        isTranscript />
                                }
                            </div>
                        </div>
                    }
                </div>
                {feedback.audio && (
                    <WaveformPlayer
                        id={feedback.id}
                        src={feedback.audio.url}
                        className="w-full md:w-80 md:self-start"
                    />
                )}
                {(feedback.images) &&
                    <div className="flex shrink-0 justify-center">
                        <ImageCarouselThumbnail
                            images={feedback.images}
                            onCardClick={() => { setDialogOpen(true) }}
                            onChangeIndex={setCurrentImgIdx} />
                        <Dialog open={dialogOpen} onOpenChange={(value) => {
                            setDialogOpen(value);
                        }}>
                            <DialogTrigger asChild>
                            </DialogTrigger>
                            <DialogContent className="md:w-fit">
                                <DialogHeader>
                                    <DialogTitle></DialogTitle>
                                    <DialogDescription></DialogDescription>
                                </DialogHeader>

                                <ImageCarouselModal images={feedback.images} jumpTo={currentImgIdx} />
                            </DialogContent>
                        </Dialog>

                    </div>
                }
            </div>
        </div>
    )
}

export { FeedbackItem, FeedbacksSkeleton }