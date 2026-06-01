import { toast } from "@/components/ui/sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { FeedbackForm, FeedbackImage } from "../data/schema";
import { urlToBlob } from "@/lib/utils";
import { TopicStatus } from "../../topics/data/schema";
import posthog from "posthog-js";

export type FeedbackAction = 'Submit';
export type FeedbackImageForm = {
    id: string;
    url: string;
    fileName: string;
    file?: File;
    isNew: boolean
}

type FeedbackFormData = {
    text: string;
    transcribeText?: string | undefined;
    audio?: Blob | null;
    images: FeedbackImageForm[];
    deletedImages: string[];
}

type FeedbackFormState = {
    feedbackId: string | undefined;
    isActive: boolean;

    isSaving: boolean;
    handleFeedbackAction: () => Promise<boolean>,

    feedback: FeedbackForm | undefined;

    formData: FeedbackFormData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleChange: (field: string, value: any) => void;
}

type FeedbackFormProviderProps = {
    topicId: string,
    topicStatus: string,
    id?: string,
    children: ReactNode
}

const FeedbackFormContext = createContext<FeedbackFormState | undefined>(undefined);

export const FeedbackFormProvider = ({ topicId, topicStatus, id, children }: FeedbackFormProviderProps) => {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFeedback = useMutation(api.feedback.save);

    const [feedbackId, setFeedbackId] = useState<string | undefined>();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FeedbackFormData>({
        text: '',
        images: [],
        deletedImages: []
    });

    const isActive = topicStatus === TopicStatus.Active;

    const feedback = useQuery(
        api.feedback.getById,
        feedbackId ? { id: feedbackId as Id<"feedback"> } : "skip"
    ) as FeedbackForm | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: string, value: any) => {
        if (field === 'text') setFormData(prev => ({ ...prev, text: value }));
        else if (field === 'images') setFormData(prev => ({ ...prev, images: value }));
        else if (field === 'deletedImages') setFormData(prev => ({ ...prev, deletedImages: value }));
        else if (field === 'transcript') setFormData(prev => ({ ...prev, transcribeText: value }));
        else if (field === 'audio') setFormData(prev => ({ ...prev, audio: value }));
    }

    const uploadFile = async (file: Blob, contentType: string): Promise<Id<"_storage">> => {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body: file,
        });
        const { storageId } = await res.json();
        return storageId as Id<"_storage">;
    };

    const handleFeedbackAction = async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            let audioStorageId: Id<"_storage"> | undefined;
            let audioFileName: string | undefined;
            if (formData.audio) {
                audioStorageId = await uploadFile(formData.audio, 'audio/webm');
                audioFileName = 'recording.webm';
            }

            const insertImages: Array<{ storageId: Id<"_storage">; fileName: string; contentType?: string; fileSize?: number }> = [];
            for (const img of formData.images.filter(p => p.isNew && p.file)) {
                const storageId = await uploadFile(img.file!, img.file!.type || 'image/jpeg');
                insertImages.push({
                    storageId,
                    fileName: img.fileName || img.file!.name,
                    contentType: img.file!.type,
                    fileSize: img.file!.size,
                });
            }

            const res = await saveFeedback({
                id: feedbackId ? (feedbackId as Id<"feedback">) : undefined,
                topicId: topicId as Id<"topics">,
                text: formData.text || undefined,
                audioStorageId,
                audioFileName,
                transcribeText: formData.transcribeText,
                removeImageIds: formData.deletedImages as Id<"files">[],
                insertImages,
                submit: true,
            });

            if (res.id) setFeedbackId(res.id);

            posthog.capture('feedback_submitted', {
                topic_id: topicId,
                feedback_id: res.id,
                has_audio: !!formData.audio,
                has_images: formData.images.length > 0,
                has_text: !!formData.text,
            });

            toast.success('Feedback submitted successfully!');
            return true;
        } catch (err) {
            toast.error('Failed to submit feedback', {
                description: err instanceof Error ? err.message : undefined,
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        async function renderImages(images?: FeedbackImage[]) {
            const files: FeedbackImageForm[] = [];
            if (images?.length) {
                for (const img of images) {
                    files.push({ id: img.id, url: img.url, fileName: img.fileName, isNew: false });
                }
            }
            setFormData(prev => ({ ...prev, images: files }));

            if (files.length > 0) {
                for (const img of files) {
                    try {
                        const blob = await urlToBlob(img.url);
                        img.file = blob ? new File([blob], img.fileName, { type: blob.type }) : undefined;
                    } catch (error) {
                        console.error(`Failed to convert image ${img.url} to file:`, error);
                        img.file = undefined;
                    }
                }
                setFormData(prev => ({ ...prev, images: files }));
            }
        }

        if (feedback) {
            setFormData(prev => ({
                ...prev,
                text: feedback.text ?? '',
                transcribeText: feedback.audio?.transcription ?? ''
            }));
            renderImages(feedback.images);
        }
    }, [feedback])

    useEffect(() => {
        setFeedbackId(id)
    }, [id])

    return (
        <FeedbackFormContext.Provider value={{
            feedbackId,
            isActive,
            isSaving,
            handleFeedbackAction,
            feedback,
            formData,
            handleChange
        }}>
            {children}
        </FeedbackFormContext.Provider>
    )
}

export const useFeedbackForm = () => {
    const context = useContext(FeedbackFormContext);
    if (!context) {
        throw new Error('useFeedbackForm must be used within a FeedbackFormProvider');
    }
    return context;
}
