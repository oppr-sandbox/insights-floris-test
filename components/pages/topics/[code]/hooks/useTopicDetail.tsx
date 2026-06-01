import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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

    statistics?: TopicStatistics,
    statsIsLoading: boolean,
    statsError: Error | null,

    respondents?: TopicRespondents[],
    respIsLoading: boolean,
    respError: Error | null,

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

type UpdateArgs = {
    id: Id<"topics">;
    name?: string;
    description?: string;
    content?: string;
    channels?: string[];
    startDate?: number | null;
    endDate?: number | null;
    isAllUsers?: boolean;
    userIds?: Id<"users">[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUpdateArgs(id: string, changes: Record<string, any>): UpdateArgs {
    const args: UpdateArgs = { id: id as Id<"topics"> };
    if ('name' in changes) args.name = changes.name;
    if ('description' in changes) args.description = changes.description;
    if ('content' in changes) args.content = changes.content;
    if ('channels' in changes) args.channels = changes.channels;
    if ('startDate' in changes) args.startDate = changes.startDate ? moment(changes.startDate).valueOf() : null;
    if ('endDate' in changes) args.endDate = changes.endDate ? moment(changes.endDate).valueOf() : null;
    if ('isAllUsers' in changes) args.isAllUsers = changes.isAllUsers;
    if ('userIds' in changes) args.userIds = changes.userIds as Id<"users">[];
    return args;
}

export const TopicDetailProvider: React.FC<{ code: string, children: ReactElement }> = ({ code, children }) => {
    const { user } = useUserDetails();

    const [initialData, setInitialData] = useState<TopicDetail | undefined>();
    const [topicDetail, setTopicDetail] = useState<TopicDetail | undefined>();
    const [id, setId] = useState<string | undefined>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [updatedData, setUpdatedData] = useState<Record<string, any>>({});

    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    const topicDetailResponse = useQuery(api.topics.getByCode, { code });
    const isLoading = topicDetailResponse === undefined;

    const updateTopic = useMutation(api.topics.update);
    const publishTopic = useMutation(api.topics.publish);
    const pauseTopic = useMutation(api.topics.pause);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addAttachments = useMutation(api.topics.addAttachments);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const persist = useCallback(async (changes: Record<string, any>) => {
        if (!id) return;
        setIsSaving(true);
        try {
            await updateTopic(toUpdateArgs(id, changes));
        } catch (e) {
            toast.error('Failed to save topic', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsSaving(false);
        }
    }, [id, updateTopic]);

    const pauseTopicAction = async () => {
        if (!id) return false;
        setIsPausing(true);
        try {
            await pauseTopic({ id: id as Id<"topics"> });
            posthog.capture('topic_paused', { topic_code: code, topic_id: id });
            return true;
        } catch (e) {
            toast.error('Failed to pause topic', { description: e instanceof Error ? e.message : undefined });
            return false;
        } finally {
            setIsPausing(false);
        }
    };

    const buildPayload = () => {
        if (!topicDetail) throw new Error('Payload cannot be null');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                            <li key={i} className='text-xs'>{e.message}</li>
                        ))}
                    </ul>
                ),
            });
        } else if (error instanceof Error) {
            toast.error(`Failed to ${action}`, { description: error.message });
        } else {
            console.error(`Failed to ${action}`, error);
        }
    };

    const handleTopicAction = async (action: TopicAction): Promise<boolean> => {
        try {
            const payload = buildPayload();

            if (action === 'Save' || action === 'Save and Publish') {
                setIsSaving(true);
                await updateTopic(toUpdateArgs(id!, payload));
                setIsSaving(false);
            }
            if (action === 'Publish' || action === 'Save and Publish') {
                setIsPublishing(true);
                await publishTopic({ id: id as Id<"topics"> });
                setIsPublishing(false);
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
            setIsSaving(false);
            setIsPublishing(false);
            handleError(err, action);
            return false;
        }
    };

    const createPayload = (field: SaveFieldType) =>
        'value' in field ? { [field.name]: field.value } : field;

    const debounceUpdateTopic = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        debounce(async (value: Record<string, any>) => {
            await persist(value);
        }, 3000),
        [persist]
    );

    const saveField = useCallback(async (field: SaveFieldType) => {
        const payload = createPayload(field);
        setUpdatedData(prev => ({ ...prev!, ...payload }));
        setTopicDetail(prev => ({ ...prev!, ...payload }));
    }, []);

    const updateFormField = useCallback((field: SaveFieldType) => {
        const payload = createPayload(field);
        setTopicDetail((prev) => ({ ...prev!, ...payload }));
    }, []);

    const resetData = useCallback(() => {
        if (initialData) setTopicDetail(cloneDeep(initialData));
    }, [initialData]);

    const uploadAttachments = async (attachments: TopicAttachmentForm[]) => {
        if (!attachments || attachments.length === 0 || !id) return false;

        try {
            const files: Array<{ storageId: Id<"_storage">, fileName: string, fileExtension: string, fileSize: number, contentType: string }> = [];
            const uploadedFiles: AttachmentData[] = [];

            for (const attach of attachments) {
                if (!attach.file) continue;
                const uploadUrl = await generateUploadUrl();
                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': attach.file.type },
                    body: attach.file,
                });
                const { storageId } = await res.json();
                const ext = attach.file.name.split('.').pop() || '';

                files.push({
                    storageId: storageId as Id<"_storage">,
                    fileName: attach.file.name,
                    fileExtension: ext,
                    fileSize: attach.file.size,
                    contentType: attach.file.type,
                });
                uploadedFiles.push({
                    id: attach.id,
                    url: URL.createObjectURL(attach.file),
                    fileName: attach.file.name,
                    fileExtension: ext,
                    fileSize: attach.file.size,
                    contentType: attach.file.type,
                    contentHash: '',
                    createdAt: new Date().toISOString(),
                    createdBy: `${user.firstName} ${user.lastName}`,
                });
            }

            await addAttachments({ id: id as Id<"topics">, files });

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
            toast.error('Failed to upload attachment.');
            return false;
        }
    };

    const hasChanges = useMemo(() => {
        if (!initialData || !topicDetail) return false;
        return !isEqual(getComparableData(initialData), getComparableData(topicDetail));
    }, [initialData, topicDetail]);

    const statsEnabled = !!id && !!topicDetail && topicDetail.status !== TopicStatus.Draft;
    const statistics = useQuery(api.topics.statistics, statsEnabled ? { id: id as Id<"topics"> } : "skip");
    const respondents = useQuery(api.topics.respondents, statsEnabled ? { id: id as Id<"topics"> } : "skip");
    const feedbacks = useQuery(api.topics.topicFeedbacks, statsEnabled ? { id: id as Id<"topics"> } : "skip");

    useEffect(() => {
        if (topicDetailResponse) {
            setId(topicDetailResponse.id);
            setTopicDetail(topicDetailResponse as unknown as TopicDetail);
            setInitialData(cloneDeep(topicDetailResponse) as unknown as TopicDetail);
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

            statistics: statistics as TopicStatistics | undefined,
            statsIsLoading: statsEnabled && statistics === undefined,
            statsError: null,

            respondents: respondents as TopicRespondents[] | undefined,
            respIsLoading: statsEnabled && respondents === undefined,
            respError: null,

            feedbacks: feedbacks as TopicFeedback[] | undefined,
            feedbacksIsLoading: statsEnabled && feedbacks === undefined,
            feedbacksError: null,
        }}>
            {children}
        </TopicDetailContext.Provider>
    )
};

export const useTopicDetail = () => {
    const context = useContext(TopicDetailContext);
    if (!context) throw new Error('useTopicDetail must be used within a TopicDetailProvider');
    return context;
};
