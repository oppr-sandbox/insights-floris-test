import { TopicChannels, TopicStatus } from "../../topics/data/schema";

export type Topic = {
    id: string;
        topicCode: string;
        name: string;
        description: string;
        status: TopicStatus;
        respondentsCount: number;
        channels: TopicChannels[],
        progress: number;
        initiatedBy: string;
        initiatedByRole: string;
        startDate: string;
        endDate: string;
        totalRespondentsCount: number;
        totalFeedbacksCount: number;
        myFeedbacksCount: number
}

export type Activity = {
    id: string;
    template: string;
    type: 'submitted-feedback' | 'generated-insights';
    metaData: any
}

export interface Stats {
    activeTopics: number;
    feedbackPendingReview: number;
    recentInsightsGenerated: number;
}
