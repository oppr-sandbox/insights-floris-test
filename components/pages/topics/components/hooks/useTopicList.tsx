import { toast } from "@/components/ui/sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Row } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, ReactNode, useContext, useReducer, useState } from "react";
import { Topic } from "../../data/schema";
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

    const searchParams = useSearchParams();
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('filter') ?? 'all';
    const view = searchParams.get('view') ?? 'cards';
    const pageSize = 15;

    const data = useQuery(api.topics.list, { filter: status, search });
    const isLoading = data === undefined;
    const topics = (data?.topics ?? []) as Topic[];
    const totalRowCount = data?.totalCount ?? 0;

    const archiveTopic = useMutation(api.topics.archive);
    const deleteTopic = useMutation(api.topics.remove);
    const pauseTopic = useMutation(api.topics.pause);
    const publishTopic = useMutation(api.topics.publish);
    const generateInsight = useMutation(api.insights.generate);

    const [isArchiving, setIsArchiving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPausing, setIsPausing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

    const handleRowClick = (row: Row<Topic>) => {
        router.push(`/${tenant}/topics/${row.original.topicCode}`);
    };

    const selectedId = () => state.selectedTopic!.id as Id<"topics">;

    const handleArchiveTopic = async () => {
        setIsArchiving(true);
        try {
            await archiveTopic({ id: selectedId() });
            toast.success('Topic Archived', { description: 'Topic has been moved to the archives.' });
            dispatch({ type: 'CONFIRM_ARCHIVE_CLOSE' });
        } catch (e) {
            toast.error('Failed to archive topic', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDeleteTopic = async () => {
        setIsDeleting(true);
        try {
            await deleteTopic({ id: selectedId() });
            toast.success('Topic Deleted', { description: 'Topic has been deleted permanently.' });
            dispatch({ type: 'CONFIRM_DELETE_CLOSE' });
        } catch (e) {
            toast.error('Failed to delete topic', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePauseTopic = async () => {
        setIsPausing(true);
        try {
            await pauseTopic({ id: selectedId() });
            toast.success('Topic Paused', { description: 'Topic has been paused.' });
            dispatch({ type: 'CONFIRM_PAUSE_CLOSE' });
        } catch (e) {
            toast.error('Failed to pause topic', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsPausing(false);
        }
    };

    const handlePublishTopic = async () => {
        setIsPublishing(true);
        try {
            await publishTopic({ id: selectedId() });
            toast.success('Topic Published', { description: 'Topic has been published.' });
            dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' });
        } catch {
            toast.error('Unable to publish topic', {
                description: 'Please edit the topic and fill the required fields.',
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleGenerateInsight = async () => {
        setIsGeneratingInsight(true);
        try {
            const res = await generateInsight({ topicId: selectedId() });
            toast.success('Topic insights generation has started', { description: 'Will let you know once the generation is done.' });
            dispatch({ type: 'CONFIRM_GENERATE_INSIGHT_CLOSE' });
            router.push(`/${tenant}/insights/${res.insightCode}`);
        } catch (e) {
            toast.error('Failed to start insight generation', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsGeneratingInsight(false);
        }
    };

    return (
        <TopicListContext.Provider value={{
            ...state,
            topics,
            totalRowCount,
            pageSize,
            isLoading,
            isFetching: false,
            isArchiving,
            isDeleting,
            isGeneratingInsight,
            isPausing,
            isPublishing,
            error: null,
            view,
            dispatch,
            handleArchiveTopic,
            handleDeleteTopic,
            handleGenerateInsight,
            handlePauseTopic,
            handlePublishTopic,
            handleRowClick,
            handleRefetch: () => undefined,
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
