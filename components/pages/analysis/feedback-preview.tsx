'use client'

import { createContext, ReactNode, useContext, useReducer } from "react";
import { FeedbackModalForm } from "@/components/pages/feedbacks/components/my-feedback-modal-form";
import { TopicStatus } from "@/components/pages/topics/data/schema";

type State = {
    feedbackId: string;
    open: boolean;
};

type Action =
    | { type: 'FEEDBACK_PREVIEW_OPEN'; payload: string }
    | { type: 'FEEDBACK_PREVIEW_CLOSE' };

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

const initialState: State = { feedbackId: '', open: false };

type SessionFeedbackPreviewContextType = {
    dispatch: React.Dispatch<Action>;
} & State;

const SessionFeedbackPreviewContext = createContext<SessionFeedbackPreviewContextType | undefined>(undefined);

const ALL_CHANNELS = ["VOICE", "TEXT", "IMAGE"];

export const SessionFeedbackPreviewProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <SessionFeedbackPreviewContext.Provider value={{ ...state, dispatch }}>
            {children}

            <FeedbackModalForm
                feedbackId={state.feedbackId}
                topicId=""
                topicChannels={ALL_CHANNELS}
                topicCode=""
                topicStatus={TopicStatus.Completed}
                topicTitle=""
                open={state.open}
                onClose={() => dispatch({ type: "FEEDBACK_PREVIEW_CLOSE" })}
                insightsPreview={true}
            />
        </SessionFeedbackPreviewContext.Provider>
    );
};

export const useSessionFeedbackPreview = () => {
    const context = useContext(SessionFeedbackPreviewContext);
    if (!context) {
        throw new Error('useSessionFeedbackPreview must be used within a SessionFeedbackPreviewProvider');
    }
    return context;
};
