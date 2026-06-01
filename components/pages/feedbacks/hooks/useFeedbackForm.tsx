import { toast } from "@/components/ui/sonner";
import { createHttpClient, ValidationError, InternalServerError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type SaveFeedbackResponse = {
    id: string;
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

    const httpClient = createHttpClient();
    const queryClient = useQueryClient();
    const [feedbackId, setFeedbackId] = useState<string | undefined>();
    const [formData, setFormData] = useState<FeedbackFormData>({
        text: '',
        images: [],
        deletedImages: []
    });

    const isActive = topicStatus === TopicStatus.Active;

    const { isPending: isSaving, mutateAsync: saveFeedbackAsync } = useMutation({
        mutationFn: (data: FormData) => httpClient.put<SaveFeedbackResponse>(`/api/feedbacks/save`, data),
        onSuccess: (response) => {
            if (response.id) {
                setFeedbackId(response.id);
            }
        }
    });

    const { data: feedback } = useQuery<FeedbackForm>({
        queryKey: ['feedback', feedbackId],
        queryFn: () => httpClient.get('/api/feedbacks/' + feedbackId),
        enabled: feedbackId !== undefined
    });

    const handleChange = (field: string, value: any) => {
        if (field === 'text') {
            setFormData(prev => ({
                ...prev,
                text: value
            }))
        }
        else if (field === 'images') {
            setFormData(prev => ({
                ...prev,
                images: value
            }))
        }
        else if (field === 'deletedImages') {
            setFormData(prev => ({
                ...prev,
                deletedImages: value
            }))
        }
        else if (field === 'transcript') {
            setFormData(prev => ({
                ...prev,
                transcribeText: value
            }))
        }
        else if (field === 'audio') {
            setFormData(prev => ({
                ...prev,
                audio: value
            }))
        }
    }

    const buildFormData = (): FormData => {
        const requestformData = new FormData();

        requestformData.append('topicId', topicId);

        if (feedbackId)
            requestformData.append('id', feedbackId);

        if (formData.text)
            requestformData.append('text', formData.text);

        if (formData.audio) {
            requestformData.append('audio.file', formData.audio);
            requestformData.append('audio.transcribeText', formData.transcribeText ?? '');
        }

        if (formData.images) {
            formData.images.filter(p => p.isNew).forEach((image, index) => {
                if (image.file)
                    requestformData.append(`image.insert[${index}]`, image.file);
            });
        }

        if (formData.deletedImages) {
            formData.deletedImages.forEach(image => {
                requestformData.append('image.delete', image);
            })
        }

        requestformData.append('submit', 'true');

        return requestformData;
    };

    const handleError = (error: unknown, action: string) => {
        if (error instanceof ValidationError) {
            const validationError = error as ValidationError;
            const validationMessages =
                validationError.errors &&
                Object.values(validationError.errors).flat();

            toast.error(`Failed to ${action} due to the following error: `, {
                description: validationMessages && validationMessages.length > 0 ? (
                    <ul className="ml-4 list-disc">
                        {validationMessages.map((msg, index) => (
                            <li key={index} className='text-xs'>{msg}</li>
                        ))}
                    </ul>
                ) : (
                    'Please fill all required fields.'
                )
            });
        }
        else if (error instanceof InternalServerError) {
            const internalServerError = error as InternalServerError;
            toast.error(internalServerError.message, { description: internalServerError.description });
        }
        else {
            toast.error(`Failed to ${action} feedback`);
        }
    };

    const handleFeedbackAction = async (): Promise<boolean> => {
        const requestformData = buildFormData();
        try {

            await saveFeedbackAsync(requestformData);

            queryClient.invalidateQueries({
                queryKey: ['my-feedbacks'],
                exact: true
            });

            queryClient.invalidateQueries({
                queryKey: ['assigned-topics'],
                exact: true
            });

            posthog.capture('feedback_submitted', {
                topic_id: topicId,
                feedback_id: feedbackId,
                has_audio: !!formData.audio,
                has_images: formData.images.length > 0,
                has_text: !!formData.text,
            });

            toast.success('Feedback submitted successfully!');
            return true;

        } catch (err) {
            handleError(err, 'submit');
            return false;
        }
    };


    useEffect(() => {

        async function renderImages(images?: FeedbackImage[]) {
            const files: FeedbackImageForm[] = [];

            if (images?.length) {
                for (const img of images) {
                    files.push({
                        id: img.id,
                        url: img.url,
                        fileName: img.fileName,
                        isNew: false
                    });
                }
            }

            setFormData(prev => ({
                ...prev,
                images: files
            }));

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

                setFormData(prev => ({
                    ...prev,
                    images: files
                }));
            }

        }

        if (feedback) {
            setFormData(prev => ({
                ...prev,
                text: feedback.text ?? '',
                transcribeText: feedback.audio?.transcription ?? ''
            }))

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