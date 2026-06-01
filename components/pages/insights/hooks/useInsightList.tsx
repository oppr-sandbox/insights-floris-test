import { toast } from "@/components/ui/sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Row } from "@tanstack/react-table";
import { useRouter, } from "next/navigation";
import { createContext, ReactNode, useContext, useReducer, useState } from "react";
import { Insight } from "../data/schema";
import { useUserDetails } from "@/providers/UserContextProvider";
import posthog from "posthog-js";

type State = {
    selectedInsight: Insight | undefined;
    showConfirmDelete: boolean;
    showConfirmPublish: boolean;
}

type Action =
    | { type: 'CONFIRM_DELETE'; payload: Insight }
    | { type: 'CONFIRM_DELETE_CLOSE'; }
    | { type: 'CONFIRM_PUBLISH'; payload: Insight }
    | { type: 'CONFIRM_PUBLISH_CLOSE'; }

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'CONFIRM_DELETE':
            return { ...state, selectedInsight: action.payload, showConfirmDelete: true };
        case 'CONFIRM_DELETE_CLOSE':
            return { ...state, showConfirmDelete: false };
        case 'CONFIRM_PUBLISH':
            return { ...state, selectedInsight: action.payload, showConfirmPublish: true };
        case 'CONFIRM_PUBLISH_CLOSE':
            return { ...state, showConfirmPublish: false };
        default:
            return state;
    }
};

const initialState: State = {
    selectedInsight: undefined,
    showConfirmDelete: false,
    showConfirmPublish: false,
};

type TopicListContextType = {
    insights: Insight[];
    isLoading: boolean;
    isDeleting: boolean;
    isPublishing: boolean;
    error: Error | null;
    dispatch: React.Dispatch<Action>;
    refetch: () => void;
    handleRowClick: (row: Row<Insight>) => void;
    handleDeleteInsight: () => void;
    handlePublishInsight: () => void;
} & State;

const InsightListContext = createContext<TopicListContextType | undefined>(undefined);

export const InsightListProvider = ({ children }: { children: ReactNode }) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    const router = useRouter();
    const { tenant } = useUserDetails();

    const handleRowClick = (row: Row<Insight>) => {
        router.push(`/${tenant}/insights/${row.original.insightCode}`)
    }

    const data = useQuery(api.insights.list);
    const insights = (data ?? []) as unknown as Insight[];
    const isLoading = data === undefined;
    const error = null;
    const refetch = () => undefined;

    const deleteInsight = useMutation(api.insights.remove);
    const publishInsight = useMutation(api.insights.publish);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleDeleteInsight = async () => {
        setIsDeleting(true);
        try {
            await deleteInsight({ id: state.selectedInsight!.id as Id<"insights"> });
            posthog.capture('insight_deleted', {
                insight_id: state.selectedInsight?.id,
                insight_code: state.selectedInsight?.insightCode,
            });
            toast.success('Insight Deleted', { description: 'Insight has been deleted permanently.' });
            dispatch({ type: 'CONFIRM_DELETE_CLOSE' })
        } catch (e) {
            toast.error('Failed to delete insight', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsDeleting(false);
        }
    }

    const handlePublishInsight = async () => {
        setIsPublishing(true);
        try {
            await publishInsight({ id: state.selectedInsight!.id as Id<"insights"> });
            posthog.capture('insight_published', {
                insight_id: state.selectedInsight?.id,
                insight_code: state.selectedInsight?.insightCode,
            });
            toast.success('Insight Published', { description: 'Insight is now visible to all members.' });
            dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' })
        } catch (e) {
            toast.error('Failed to publish insight', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsPublishing(false);
        }
    }

    return (
        <InsightListContext.Provider value={{
            ...state,
            insights: insights ?? [],
            error,
            isLoading,
            isDeleting,
            isPublishing,
            dispatch,
            handleDeleteInsight,
            handlePublishInsight,
            handleRowClick,
            refetch
        }}>
            {children}
        </InsightListContext.Provider>
    );
};

export const useInsightList = () => {
    const context = useContext(InsightListContext);

    if (!context) {
        throw new Error('useInsightList must be used within a InsightListProvider');
    }

    return context;
};
