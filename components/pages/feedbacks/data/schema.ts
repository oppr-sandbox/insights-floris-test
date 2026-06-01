import {
    FeedbackUser,
    TopicChannels,
    TopicStatus,
} from "../../topics/data/schema";
import { FeedbackStatus } from "./data";

export type User = {
    avatar: string;
    initials: string;
    name: string;
    position: string;
};

export type Topic = {
    id: string;
    topicCode: string;
    name: string;
    description: string;
    status: TopicStatus;
    respondentsCount: number;
    channels: TopicChannels[];
    progress: number;
    initiatedBy: string;
    initiatedByRole: string;
    startDate: string;
    endDate: string;
    totalRespondentsCount: number;
    totalFeedbacksCount: number;
    myFeedbacksCount: number;
};

export type Feedback = {
    id: string;
    feedbackCode: string;
    feedbackStatus: FeedbackStatus;
    topicId: string;
    topicCode: string;
    topicName: string;
    topicStatus: TopicStatus;
    dateSubmitted: string;
    text: string | null;
    transcribedText: string | null;
    channels: TopicChannels[];
};

export type FeedbackImage = {
    id: string;
    url: string;
    fileName: string;
};

export type FeedbackForm = {
    id: string;
    topicId: string;
    topicCode: string;
    feedbackCode: string;
    dateSubmitted: string;
    text: string;
    audio: {
        url: string;
        transcription: string;
    };
    images: FeedbackImage[];
    user: FeedbackUser;
};
