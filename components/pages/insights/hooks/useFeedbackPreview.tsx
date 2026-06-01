import { createContext, ReactNode, useContext, useReducer, useState } from "react";
import { InsightDetails } from "../data/schema";
import { FeedbackModalForm } from "../../feedbacks/components/my-feedback-modal-form";
import { TopicStatus } from "../../topics/data/schema";

type State = {
    feedbackId: string;
    open: boolean;
}

type Action =
    | { type: 'FEEDBACK_PREVIEW_OPEN'; payload: string }
    | { type: 'FEEDBACK_PREVIEW_CLOSE'; }

type FeedbackPreviewProviderProps = {
    insightDetails: InsightDetails;
    children: ReactNode;
}

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'FEEDBACK_PREVIEW_OPEN':
            return { ...state, feedbackId: action.payload, open: true };
        case 'FEEDBACK_PREVIEW_CLOSE':
            return { ...state, feedbackId: '', open: false };
        default:
            return state;
    }
};

const initialState: State = {
    feedbackId: '',
    open: false,
}

type FeedbackPreviewContextType = {
    dispatch: React.Dispatch<Action>;
} & State

const FeedbackPreviewContext = createContext<FeedbackPreviewContextType | undefined>(undefined);

export const FeedbackPreviewProvider = ({ insightDetails, children, }: FeedbackPreviewProviderProps) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <FeedbackPreviewContext.Provider value={{
            ...state,
            dispatch
        }}>
            {children}

            <FeedbackModalForm
                feedbackId={state.feedbackId}
                topicId={insightDetails.topicId}
                topicChannels={insightDetails.topicChannels}
                topicCode={insightDetails.topicCode}
                topicStatus={TopicStatus.Completed}
                topicTitle={insightDetails.topicName}
                open={state.open}
                onClose={() => {
                    dispatch({ type: "FEEDBACK_PREVIEW_CLOSE" })
                }}
                insightsPreview={true}
            />
        </FeedbackPreviewContext.Provider>
    )
}

export const useFeedbackPreview = () => {
    const context = useContext(FeedbackPreviewContext);

    if (!context) {
        throw new Error('useFeedbackPreview must be used within a FeedbackPreviewProvider');
    }

    return context;
}