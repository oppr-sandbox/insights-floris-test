import { AttachmentData } from "@/components/attachments/attachment-card";
import { SentimentValues } from "@/components/feedbacks/feedbacks";

export type GetTopicResponse = {
    totalCount: number;
    pageCount: number;
    topics: Topic[]
}

export type User = {
    id: string;
    displayName: string;
    position: string;
    isSelected?: boolean; // local-only field for UI state
}

export type Respondent = {
    image: string;
    initials: string;
    name: string; 
}

export type Topic = {
    id: string;
    topicCode: string;
    name: string;
    description: string;
    status: TopicStatus;
    recentRespondents?: Array<Respondent>;
    endDate: string;
    channels: TopicChannels[];
    progress: number;
    respondentsCount: number;
    totalRespondentsCount: number,
    totalFeedbacksCount: number
}

export interface TopicDetail {
    id: string;
    topicCode: string;
    name?: string;
    description?: string;
    status: TopicStatus;
    content?: string;
    channels?: TopicChannels[];
    startDate?: Date;
    endDate?: Date;
    isAllUsers: boolean;
    userIds?: string[];
    topicAttachments?: Array<AttachmentData>;
}

export type TopicAttachmentForm = {
    id: string;
    file: File;
}

export interface TopicStatistics {
    id: string;
    topicCode: string;
    name: string;
    respondentsCount: number;
    totalRespondentsCount: number;
    totalFeedbacksCount: number;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    channels?: TopicChannels[];
    status: string;
    role: string;
    displayName: string;
}

export interface TopicRespondents {
    id: string;
    displayName: string;
    image: string;
    initials: string;

    role: string;
    feedbackCount: number;
}

export interface TopicContents {
    id: string;
    description: string;
    attachments?: Array<AttachmentData>
}

export interface TopicFeedback {
    id: string;
    user: FeedbackUser;
    dateSubmitted: string;
    sentiment?: SentimentValues;
    text?: string;
    textLangCode?: string;
    transcribedText?: string;
    transcribedTextLangCode?: string;
    imageFiles?: Array<AttachmentData>;
    audioFile?: AttachmentData;
}

export interface FeedbackUser {
    id: string;
    email: string;
    displayName: string;
    initials: string;
    userImage?: string;
}

export enum TopicStatus {
    Draft = 'DRAFT',
    Published = 'PUBLISHED',
    Active = 'ACTIVE',
    Paused = 'PAUSED',
    Completed = 'COMPLETED'
} 

export enum TopicChannels {
    Text = 'TEXT',
    Voice = 'VOICE',
    Image = 'IMAGE',
}
