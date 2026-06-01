import { formatDate } from "@/utils/helpers/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { FileAudio, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { ImageCarouselModal, ImageCarouselThumbnail } from "../attachments/attachment-preview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { getAvatarUrl } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChannelBadge } from "../channels/channels-badge";
import { TopicChannels } from "../pages/topics/data/schema";
import { Spinner } from "../ui/spinner";
import { Translation, useFeedbackItem } from "./hooks/useFeedbackItem";

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

export type FeedbackItemProps = {
    id: string;
    sentiment?: SentimentValues;
    submittedBy: {
        image: string;
        name: string;
        initials: string;
        position: string;
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
    const isMobile = useIsMobile();
    const {
        text,
        showText,
        transcript,
        showTranscript,

        isPaused,
        playAudio,
        pauseAudio,
        replayAudio,
        onAudioEnded,
        formatTime,

    } = useFeedbackItem(feedback);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [duration, setDuration] = useState<number | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentImgIdx, setCurrentImgIdx] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 1;
        const handleMetadata = () => {
            if (audio.duration === Infinity) {
                // Force seeking to a large time to trigger duration correction
                audio.currentTime = 1e101;
                audio.ontimeupdate = () => {
                    audio.ontimeupdate = null;
                    setDuration(audio.duration);
                    audio.currentTime = 0; // reset
                };
            } else {
                setDuration(audio.duration);
            }
        };


        audio.addEventListener("loadedmetadata", handleMetadata);

        return () => {
            audio.removeEventListener("loadedmetadata", handleMetadata);
        };
    }, [feedback.audio]);

    return (
        <div className="border border-border-grey rounded-lg p-4 bg-muted/25 ">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-6 w-full space-y-2">
                    <div className="flex space-x-4">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(feedback.submittedBy.image, 'x32')} alt={feedback.submittedBy.name} />
                            <AvatarFallback className="text-base">{feedback.submittedBy.initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-x-2">
                                <span className="text-base font-semibold">{feedback.submittedBy.name}</span>
                                {isMobile == false && (<span className="text-sm text-muted-foreground">•</span>)}
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(feedback.dateSubmitted)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {feedback.text && <ChannelBadge channel={TopicChannels.Text} />}
                                {feedback.audio && <ChannelBadge channel={TopicChannels.Voice} />}
                                {feedback.images && <ChannelBadge channel={TopicChannels.Image} />}
                            </div>
                        </div>
                    </div>
                    {feedback.text &&
                        <div className="space-y-1">
                            <div className="flex flex-col space-y-2 px-4 py-2">
                                <div className="text-base">
                                    {feedback.text}
                                </div>
                            </div>
                            {feedback.textLangCode && !feedback.textLangCode.startsWith('en') &&
                                <FeedbackTranslation
                                    text={text}
                                    langCode={feedback.textLangCode}
                                    showTranslation={showText} />
                            }
                        </div>
                    }
                    {feedback.audio &&
                        <div className="space-y-1 mt-4">
                            <div className="flex flex-col space-y-2 px-4 py-2 border-l-4 border-muted-foreground/50 bg-muted/50 shadow-md">
                                <div className="text-base italic">
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
                    <div className="flex-2 my-2">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <FileAudio />
                                <span className="text-small text-dark-grey">
                                    Voice Recording ({formatTime(duration ?? 0)})
                                </span>
                            </div>
                            <audio
                                ref={audioRef}
                                preload="metadata"
                                controls
                                onEnded={onAudioEnded}
                                src={feedback.audio.url}
                                className="hidden">
                            </audio>
                            <div className="flex items-center justify-center p-2 bg-background rounded-xl">
                                <div className="flex items-center gap-4">
                                    {isPaused ?
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={() => playAudio(audioRef.current)} variant="ghost" className="rounded-full" size="icon">
                                                    <IconPlayerPlayFilled className="h-6 w-6" />
                                                    <span className="sr-only">Play</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <span className="text-xs">Play</span>
                                            </TooltipContent>
                                        </Tooltip>
                                        :
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={() => pauseAudio(audioRef.current)} variant="ghost" className="rounded-full" size="icon">
                                                    <IconPlayerPauseFilled className="h-6 w-6" />
                                                    <span className="sr-only">Pause</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <span className="text-xs">Pause</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    }
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button onClick={() => replayAudio(audioRef.current)} variant="ghost" className="rounded-full" size="icon">
                                                <RotateCcw className="h-6 w-6" />
                                                <span className="sr-only">Replay</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <span className="text-xs">Replay</span>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {(feedback.images) &&
                    <div className="flex my-2 justify-center mx-12">
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