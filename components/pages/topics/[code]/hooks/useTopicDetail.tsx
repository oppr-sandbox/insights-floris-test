import { createHttpClient, InternalServerError, ValidationError } from '@/utils/api/createHttpClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TopicAttachmentForm, TopicDetail, TopicFeedback, TopicRespondents, TopicStatistics, TopicStatus } from '../../data/schema';
import { toast } from '@/components/ui/sonner';
import { cloneDeep, isEqual } from 'lodash';
import { AttachmentData } from '@/components/attachments/attachment-card';
import { useUserDetails } from '@/providers/UserContextProvider';
import { topicDetailSchema } from '../../data/validation';
import z from 'zod';
import moment from 'moment';
import { debounce } from '@/utils/helpers/helpers';
import posthog from 'posthog-js';

// Create context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SaveFieldType = { name: string, value: any } | Record<string, any>;
export type TopicAction = 'Save' | 'Publish' | 'Save and Publish';

const TopicDetailContext = createContext<{
    data?: TopicDetail,
    isLoading: boolean,

    hasChanges: boolean,
    isSaving: boolean,
    updateFormField: (field: SaveFieldType) => void,
    uploadAttachments: (attachment: TopicAttachmentForm[]) => Promise<boolean>,
    saveField: (field: SaveFieldType) => void,
    isPublishing: boolean,
    handleTopicAction: (action: TopicAction) => Promise<boolean>,
    isPausing: boolean,
    pauseTopicAction: () => Promise<boolean>,
    resetData: () => void,

    //Statistics Tab
    statistics?: TopicStatistics,
    statsIsLoading: boolean,
    statsError: Error | null,

    respondents?: TopicRespondents[],
    respIsLoading: boolean,
    respError: Error | null,

    //Feedbacks Tab
    feedbacks?: TopicFeedback[],
    feedbacksIsLoading: boolean,
    feedbacksError: Error | null,

} | undefined
>(undefined);

function getComparableData(topicDetail: TopicDetail) {
    return {
        name: topicDetail.name ?? "",
        description: topicDetail.description ?? "",
        content: topicDetail.content ?? "",
        channels: topicDetail.channels ?? [],
        startDate: topicDetail.startDate ?? null,
        endDate: topicDetail.endDate ?? null,
        isAllUsers: topicDetail.isAllUsers ?? false,
        userIds: topicDetail.isAllUsers ? [] : topicDetail.userIds ?? [],
    };
}

// Provider component
export const TopicDetailProvider: React.FC<{ code: string, children: ReactElement }> = ({ code, children }) => {
    const httpClient = createHttpClient();

    // TODO: Wrap the layout to user provider to get the user easily 
    const { user } = useUserDetails();

    const [initialData, setInitialData] = useState<TopicDetail | undefined>();
    const [topicDetail, setTopicDetail] = useState<TopicDetail | undefined>();
    const [id, setId] = useState<string | undefined>();
    const [updatedData, setUpdatedData] = useState<Record<string, any>>({});

    // TODO: handle query error
    const { data: topicDetailResponse, error, isLoading } = useQuery<TopicDetail>({
        queryKey: ['topic', code],
        gcTime: 0,
        queryFn: () => httpClient.get(`/api/topics/${code}`),
        enabled: !!code,
    });

    const { isPending: isSaving, mutateAsync: updateTopicAsync } = useMutation({
        mutationFn: (data: SaveFieldType) => httpClient.put(`/api/topics/${id}`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    const { isPending: isPublishing, mutateAsync: publishTopicAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/topics/${id}/publish`, {}),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    const { isPending: isPausing, mutateAsync: pauseTopicAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/topics/${id}/pause`, {}),
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
        onSuccess: (): boolean => {
            return true;
        }
    });

    const pauseTopicAction = async () => {
        try {
            await pauseTopicAsync();
            posthog.capture('topic_paused', { topic_code: code, topic_id: id });
            return true;
        } catch {
            return false;
        }
    };

    const buildPayload = () => {
        if (!topicDetail) throw new Error('Payload cannot be null');

        const payload: Record<string, any> = {
            name: topicDetail.name,
            description: topicDetail.description,
            status: topicDetail.status,
            content: topicDetail.content,
            channels: topicDetail.channels,
            startDate: topicDetail.startDate ? moment(topicDetail.startDate).toDate() : undefined,
            endDate: topicDetail.endDate ? moment(topicDetail.endDate).toDate() : undefined,
            isAllUsers: topicDetail.isAllUsers ?? false,
            userIds: topicDetail.isAllUsers ? [] : topicDetail.userIds,
        };

        return topicDetailSchema.parse(payload);
    };

    const handleError = (error: unknown, action: string) => {
        if (error instanceof z.ZodError) {
            toast.error(`Failed to ${action} due to the following error:`, {
                description: (
                    <ul className='ml-4 list-disc'>
                        {error.issues.map((e, i) => (
                            <li key={i} className='text-xs'>
                                {e.message}
                            </li>
                        ))}
                    </ul>
                ),
            });
        } else {
            console.error(`Failed to ${action}`, error);
        }
    };

    const handleTopicAction = async (action: TopicAction): Promise<boolean> => {
        try {

            const payload = buildPayload();

            if (action === 'Save' || action === 'Save and Publish') {
                await saveField(payload);
            }
            if (action === 'Publish' || action === 'Save and Publish') {
                await publishTopicAsync();
            }

            if (action === 'Publish' || action === 'Save and Publish') {
                posthog.capture('topic_published', { topic_code: code, topic_id: id });
            }

            const successMessage =
                action === 'Save'
                    ? 'Topic successfully updated!'
                    : action === 'Publish'
                        ? 'Topic successfully published!'
                        : 'Topic updated and published successfully!';

            toast.success(successMessage);
            return true;
        } catch (err) {
            handleError(err, action);
            return false;
        }
    };

    const { isPending: uploadIsPending, isSuccess: uploadSucceeded, mutateAsync: uploadTopicAttachmentAsync } = useMutation({
        mutationFn: (formData: FormData) => httpClient.patch(`/api/topics/${id}/attachments`, formData),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    const createPayload = (field: SaveFieldType) =>
        'value' in field ? { [field.name]: field.value } : field;

    const debounceUpdateTopic = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        debounce(async (value: Record<string, any>) => {
            await updateTopicAsync(value)
        }, 3000),
        [updatedData]
    );

    const saveField = useCallback(async (field: SaveFieldType) => {
        const payload = createPayload(field);
        // await updateTopicAsync(payload);
        setUpdatedData(prev => ({ ...prev!, ...payload }))
        setTopicDetail(prev => ({ ...prev!, ...payload }));
    }, [updateTopicAsync]);

    const updateFormField = useCallback((field: SaveFieldType) => {
        const payload = createPayload(field);
        setTopicDetail((prev) => ({ ...prev!, ...payload }));
    }, []);

    const resetData = useCallback(() => {
        if (initialData) setTopicDetail(cloneDeep(initialData));
    }, [initialData]);

    const uploadAttachments = async (attachments: TopicAttachmentForm[]) => {
        if (!attachments || attachments.length === 0) return false;

        const formData = new FormData();
        const uploadedFiles: AttachmentData[] = [];

        attachments.forEach((attach, idx) => {
            if (!attach.file) return;

            formData.append(`attachment[${idx}].id`, attach.id);
            formData.append(`attachment[${idx}].file`, attach.file);

            uploadedFiles.push({
                id: attach.id,
                url: URL.createObjectURL(attach.file),
                fileName: attach.file.name,
                fileExtension: attach.file.name.split('.').pop() || '',
                fileSize: attach.file.size,
                contentType: attach.file.type,
                contentHash: '',
                createdAt: new Date().toISOString(),
                createdBy: `${user.firstName} ${user.lastName}`,
            });
        });

        try {
            await uploadTopicAttachmentAsync(formData);

            posthog.capture('topic_attachment_uploaded', {
                topic_code: code,
                topic_id: id,
                attachment_count: attachments.length,
            });

            setInitialData((prev) => ({
                ...prev!,
                topicAttachments: [...(prev?.topicAttachments ?? []), ...uploadedFiles],
            }));

            setTopicDetail((prev) => ({
                ...prev!,
                topicAttachments: [...(prev?.topicAttachments ?? []), ...uploadedFiles],
            }));

            return true;
        } catch (error) {
            posthog.captureException(error);
            console.error('Upload failed:', error);
            toast.error('Failed to upload attachment.');
            return false;
        }
    };

    const hasChanges = useMemo(() => {
        if (!initialData || !topicDetail) return false;

        const initialComparable = getComparableData(initialData);
        const currentComparable = getComparableData(topicDetail);

        return !isEqual(initialComparable, currentComparable);
    }, [initialData, topicDetail]);

    // Tab details
    const { data: statistics, isLoading: statsIsLoading, error: statsError } = useQuery<TopicStatistics>({
        queryKey: ["topic", id, 'statistics'],
        queryFn: () => httpClient.get(`/api/topic/statistics/${id}`),
        enabled: !!id && !!topicDetail && topicDetail.status !== TopicStatus.Draft,
    });

    const { data: respondents, isLoading: respIsLoading, error: respError } = useQuery<TopicRespondents[]>({
        queryKey: ["topic", id, 'respondents'],
        queryFn: () => httpClient.get(`/api/topic/respondents/${id}`),
        enabled: !!id && !!topicDetail && topicDetail.status !== TopicStatus.Draft,
    });

    const {
        data: feedbacks, isLoading: feedbacksIsLoading, error: feedbacksError,
    } = useQuery<TopicFeedback[]>({
        queryKey: ["topic", id, 'feedbacks'],
        queryFn: () => httpClient.get(`/api/topic/feedbacks/${id}`),
        enabled: !!id && !!topicDetail && topicDetail.status !== TopicStatus.Draft,
    })

    useEffect(() => {
        if (topicDetailResponse) {
            setId(topicDetailResponse.id);
            setTopicDetail(topicDetailResponse);
            setInitialData(cloneDeep(topicDetailResponse));
        }
    }, [topicDetailResponse]);

    useEffect(() => {
        if (Object.keys(updatedData).length) {
            debounceUpdateTopic(updatedData);
        }
        return () => {
            debounceUpdateTopic.cancel?.();
        };
    }, [updatedData]);

    return (
        <TopicDetailContext.Provider value={{
            data: topicDetail,
            isLoading,

            hasChanges,
            isSaving,
            updateFormField,
            uploadAttachments,
            saveField,
            isPublishing,
            handleTopicAction,
            isPausing,
            pauseTopicAction,
            resetData,

            statistics,
            statsIsLoading,
            statsError,

            respondents,
            respIsLoading,
            respError,

            feedbacks,
            feedbacksIsLoading,
            feedbacksError,

        }}>
            {children}
        </TopicDetailContext.Provider>
    )
};

// Custom hook for convenience
export const useTopicDetail = () => {
    const context = useContext(TopicDetailContext);
    if (!context) throw new Error('useTopicDetail must be used within a TopicDetailProvider');
    return context;
};