import { toast } from "@/components/ui/sonner";
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Row } from "@tanstack/react-table";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { GetTopicResponse, Topic } from "../../data/schema";
import { useUserDetails } from "@/providers/UserContextProvider";

type State = {
    selectedTopic: Topic | undefined;
    showConfirmArchive: boolean;
    showConfirmDelete: boolean;
    showConfirmGenerateInsight: boolean;
    showConfirmPause: boolean;
    showConfirmPublish: boolean;
}

type Action =
    | { type: 'CONFIRM_ARCHIVE'; payload: Topic }
    | { type: 'CONFIRM_ARCHIVE_CLOSE'; }
    | { type: 'CONFIRM_DELETE'; payload: Topic }
    | { type: 'CONFIRM_DELETE_CLOSE'; }
    | { type: 'CONFIRM_GENERATE_INSIGHT'; payload: Topic }
    | { type: 'CONFIRM_GENERATE_INSIGHT_CLOSE'; }
    | { type: 'CONFIRM_PAUSE'; payload: Topic }
    | { type: 'CONFIRM_PAUSE_CLOSE'; }
    | { type: 'CONFIRM_PUBLISH'; payload: Topic }
    | { type: 'CONFIRM_PUBLISH_CLOSE'; };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'CONFIRM_ARCHIVE':
            return { ...state, selectedTopic: action.payload, showConfirmArchive: true };
        case 'CONFIRM_ARCHIVE_CLOSE':
            return { ...state, selectedTopic: undefined, showConfirmArchive: false };
        case 'CONFIRM_DELETE':
            return { ...state, selectedTopic: action.payload, showConfirmDelete: true };
        case 'CONFIRM_DELETE_CLOSE':
            return { ...state, selectedTopic: undefined, showConfirmDelete: false };
        case 'CONFIRM_GENERATE_INSIGHT':
            return { ...state, selectedTopic: action.payload, showConfirmGenerateInsight: true };
        case 'CONFIRM_GENERATE_INSIGHT_CLOSE':
            return { ...state, selectedTopic: undefined, showConfirmGenerateInsight: false };
        case 'CONFIRM_PAUSE':
            return { ...state, selectedTopic: action.payload, showConfirmPause: true };
        case 'CONFIRM_PAUSE_CLOSE':
            return { ...state, selectedTopic: undefined, showConfirmPause: false };
        case 'CONFIRM_PUBLISH':
            return { ...state, selectedTopic: action.payload, showConfirmPublish: true };
        case 'CONFIRM_PUBLISH_CLOSE':
            return { ...state, selectedTopic: undefined, showConfirmPublish: false };
        default:
            return state;
    }
};

const initialState: State = {
    selectedTopic: undefined,
    showConfirmArchive: false,
    showConfirmDelete: false,
    showConfirmGenerateInsight: false,
    showConfirmPause: false,
    showConfirmPublish: false
};

type TopicListContextType = {
    topics: Topic[];
    totalRowCount: number;
    pageSize: number;
    isLoading: boolean;
    isFetching: boolean;
    isArchiving: boolean;
    isDeleting: boolean;
    isGeneratingInsight: boolean;
    isPausing: boolean;
    isPublishing: boolean;
    error: Error | null;
    view: string;
    dispatch: React.Dispatch<Action>;
    handleRefetch: () => void;
    handleRowClick: (row: Row<Topic>) => void;
    handleArchiveTopic: () => void;
    handleDeleteTopic: () => void;
    handleGenerateInsight: () => void;
    handlePauseTopic: () => void;
    handlePublishTopic: () => void;
} & State;

const TopicListContext = createContext<TopicListContextType | undefined>(undefined);

export const TopicListProvider = ({ children }: { children: ReactNode }) => {

    const { tenant } = useUserDetails();
    const [state, dispatch] = useReducer(reducer, initialState);

    const router = useRouter();
    const httpClient = createHttpClient();
    const queryClient = useQueryClient();

    const searchParams = useSearchParams()
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('filter') ?? 'all';
    const view = searchParams.get('view') ?? 'cards';
    const pageSize = 15;

    const handleRowClick = (row: Row<Topic>) => {
        router.push(`/${tenant}/topics/${row.original.topicCode}`)
    }

    const { data, fetchNextPage, isFetching, isLoading, refetch, error } = useInfiniteQuery<GetTopicResponse>({
        queryKey: [
            'topics',
            status, //refetch when the status changes
            search, //refetch on user's search
        ],
        queryFn: async ({ pageParam = 0 }) => {
            return await httpClient.get(`/api/topics?filter=${status}&page=${(pageParam as number) + 1}&pageSize=${pageSize}&search=${search}`)
        },
        initialPageParam: 0,
        getNextPageParam: (_lastGroup, groups) => groups.length,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    })

    const { isPending: isArchiving, mutateAsync: archiveTopicAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/topics/${state.selectedTopic!.id}/archive`),
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
        onSuccess: () => {
            toast.success('Topic Archived', { description: 'Topic has been moved to the archives.' });
            dispatch({ type: 'CONFIRM_ARCHIVE_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['topics'] })
        }
    });

    const { isPending: isDeleting, mutateAsync: deleteTopicAsync } = useMutation({
        mutationFn: () => httpClient.delete(`/api/topics/${state.selectedTopic!.id}`),
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
        onSuccess: () => {
            toast.success('Topic Deleted', { description: 'Topic has been deleted permanently.' });
            dispatch({ type: 'CONFIRM_DELETE_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['topics'] })
        }
    });

    const { isPending: isPausing, mutateAsync: pauseTopicAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/topics/${state.selectedTopic!.id}/pause`, {}),
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
        onSuccess: () => {
            toast.success('Topic Paused', { description: 'Topic has been paused.' });
            dispatch({ type: 'CONFIRM_PAUSE_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['topics'] })
        }
    });

    const { isPending: isPublishing, mutateAsync: publishTopicAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/topics/${state.selectedTopic!.id}/publish`, {}),
        onError: (error) => {
            if (error instanceof ValidationError) {
                toast.error('Unable to publish topic', {
                    description: 'Please edit the topic and fill the required fields.'
                });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        },
        onSuccess: () => {
            toast.success('Topic Published', { description: 'Topic has been published.' });
            dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['topics'] })
        }
    });

    const { isPending: isGeneratingInsight, mutateAsync: generateInsightAsync } = useMutation({
        mutationFn: () => httpClient.post<{
            insightId: string;
            insightCode: string;
        }>(`/api/insights/${state.selectedTopic?.id}/generate`, {}),
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
        onSuccess: (response) => {
            toast.success('Topic insights generation has started', { description: 'Will let you know once the generation is done.' });
            dispatch({ type: 'CONFIRM_GENERATE_INSIGHT_CLOSE' })
            redirect(`/insights/${response.insightCode}`);
        }
    });

    //flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
        () => data?.pages?.flatMap(page => page?.topics ?? []) ?? [],
        [data]
    )

    const totalRowCount = data?.pages?.[0]?.totalCount ?? 0
    const totalFetched = flatData.length ?? 0

    //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
    const fetchMoreOnBottomReached = useCallback(
        () => {
            const isAtBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight;
            if (isAtBottom) {
                //once the user has scrolled to the bottom of the page, fetch more data if we can
                if (!isFetching && totalFetched < totalRowCount) {
                    fetchNextPage()
                }
            }
        },
        [fetchNextPage, isFetching, totalFetched, totalRowCount]
    )

    useEffect(() => {
        window.addEventListener('scroll', fetchMoreOnBottomReached);
        return () => {
            window.removeEventListener('scroll', fetchMoreOnBottomReached);
        };
    }, [fetchMoreOnBottomReached]);

    return (
        <TopicListContext.Provider value={{
            ...state,
            topics: flatData,
            totalRowCount,
            pageSize,
            isLoading,
            isFetching,
            isArchiving,
            isDeleting,
            isGeneratingInsight,
            isPausing,
            isPublishing,
            error,
            view,
            dispatch,
            handleArchiveTopic: archiveTopicAsync,
            handleDeleteTopic: deleteTopicAsync,
            handleGenerateInsight: generateInsightAsync,
            handlePauseTopic: pauseTopicAsync,
            handlePublishTopic: publishTopicAsync,
            handleRowClick,
            handleRefetch: refetch
        }}>
            {children}
        </TopicListContext.Provider>
    );
};

export const useTopicList = () => {
    const context = useContext(TopicListContext);

    if (!context) {
        throw new Error('useTopicList must be used within a TopicListProvider');
    }

    return context;
};
