"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import VoiceChannel from "./voice-channel";
import TextChannel from "./text-channel";
import ImageChannel from "./image-channel";

import { TopicStatus } from "../../topics/data/schema";
import { FeedbackFormProvider, useFeedbackForm } from "../hooks/useFeedbackForm";
import moment from "moment";
import { useUserDetails } from "@/providers/UserContextProvider";
import { UpgradePrompt } from "@/components/upgrade-prompt";

type MyFeedbackModalFormProps = {
    feedbackId?: string;
    topicId: string;
    topicCode: string;
    topicStatus: TopicStatus;
    topicTitle: string;
    topicChannels: string[];
    open: boolean;
    onClose: () => void;
    insightsPreview?: boolean;
};

const Content = ({
    topicCode,
    topicTitle,
    topicChannels,
    insightsPreview,
    open,
    onClose
}: MyFeedbackModalFormProps) => {

    const { hasActiveSubscription } = useUserDetails();
    const {
        isActive,
        handleFeedbackAction,
        isSaving,
        feedback
    } = useFeedbackForm()

    return (
        <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="flex flex-col md:grid rounded-none border-none h-full max-h-full max-w-full md:rounded-lg md:border md:h-auto md:max-h-[90rem] md:max-w-2xl">
                <DialogHeader>
                    {!insightsPreview && (
                        <>
                            <DialogDescription className="text-left">Topic ID: {topicCode}</DialogDescription>
                            <DialogTitle className="text-left">Provide Feedback: {topicTitle}</DialogTitle>
                        </>
                    )}
                    {insightsPreview && (
                        <>
                            <DialogTitle className="text-left">Feedback provided by {feedback?.user.displayName}</DialogTitle>
                            <DialogDescription className="text-left">{moment(feedback?.dateSubmitted).format('DD-MMM-YYYY')}</DialogDescription>
                        </>
                    )}
                </DialogHeader>
                <div className="flex-1 flex flex-col">
                    <ScrollArea className="max-h-[75vh]">
                        <div className="flex-1 flex flex-col gap-y-2">
                            {topicChannels.includes("VOICE") && <VoiceChannel />}
                            {topicChannels.includes("TEXT") && <TextChannel />}
                            {topicChannels.includes("IMAGE") && <ImageChannel />}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        {!insightsPreview && <Button variant="outline">Cancel</Button>}
                    </DialogClose>
                    {isActive && !hasActiveSubscription && !insightsPreview && (
                        <UpgradePrompt action="submit feedback" />
                    )}
                    {
                        isActive && hasActiveSubscription && (
                            <Button disabled={isSaving} onClick={async () => {
                                const success = await handleFeedbackAction();
                                if (success)
                                    onClose()
                            }}>
                                Submit
                            </Button>
                        )
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function FeedbackModalForm(props: MyFeedbackModalFormProps) {
    const { topicId, topicStatus, feedbackId } = props;

    return (
        <FeedbackFormProvider
            topicId={topicId}
            topicStatus={topicStatus}
            id={feedbackId}
        >
            <Content {...props} />
        </FeedbackFormProvider>
    );
}
