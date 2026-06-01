import { toast } from "@/components/ui/sonner";
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Row } from "@tanstack/react-table";
import { useRouter, } from "next/navigation";
import { createContext, ReactNode, useContext, useReducer } from "react";
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
    const httpClient = createHttpClient();
    const queryClient = useQueryClient();
    const { tenant } = useUserDetails();

    const handleRowClick = (row: Row<Insight>) => {
        router.push(`/${tenant}/insights/${row.original.insightCode}`)
    }

    const { data: insights, error, isLoading, refetch } = useQuery<Insight[]>({
        queryKey: ['insights'],
        queryFn: () => httpClient.get('/api/insights')
    });

    const { isPending: isDeleting, mutateAsync: deleteInsightAsync } = useMutation({
        mutationFn: () => httpClient.delete(`/api/insights/${state.selectedInsight?.id}`),
    });

    const { isPending: isPublishing, mutateAsync: publishInsightAsync } = useMutation({
        mutationFn: () => httpClient.patch(`/api/insights/${state.selectedInsight?.id}/publish`, {}),
    });

    const handleDeleteInsight = async () => {
        try {
            await deleteInsightAsync();
            posthog.capture('insight_deleted', {
                insight_id: state.selectedInsight?.id,
                insight_code: state.selectedInsight?.insightCode,
            });
            toast.success('Insight Deleted', { description: 'Insight has been deleted permanently.' });
            dispatch({ type: 'CONFIRM_DELETE_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['insights'] })
        } catch (error) {
            handleError(error)
        }
    }

    const handlePublishInsight = async () => {
        try {
            await publishInsightAsync();
            posthog.capture('insight_published', {
                insight_id: state.selectedInsight?.id,
                insight_code: state.selectedInsight?.insightCode,
            });
            toast.success('Insight Published', { description: 'Insight is now visible to all members.' });
            dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' })
            queryClient.invalidateQueries({ queryKey: ['insights'] })
            queryClient.invalidateQueries({ queryKey: ['published-insights'] })
        } catch (error) {
            handleError(error)
        }
    }

    const handleError = (error: unknown) => {
        if (error instanceof ValidationError) {
            const validationError = error as ValidationError;
            const errorMessages: string[] = []

            for (const key in validationError.errors) {
                if (validationError.errors.hasOwnProperty(key)) {
                    for (const message of validationError.errors[key]) {
                        errorMessages.push(message);
                    }
                }
            }

            toast.error(validationError.message, {
                description: (
                    <ul className='ml-4 list-disc'>
                        {errorMessages.map((message, i) => (
                            <li key={i} className='text-xs'>
                                {message}
                            </li>
                        ))}
                    </ul>
                ),
            });
        }
        else if (error instanceof InternalServerError) {
            const internalServerError = error as InternalServerError;
            toast.error(internalServerError.message, { description: internalServerError.description });
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
