import { UIMessage } from "@ai-sdk/react";
import { InsightStatus } from "./data";
import { TopicChannels } from "../../topics/data/schema";

export type Insight = {
    id: string;
    insightCode: string;
    topicId: string;
    topicCode: string;
    topicName: string;
    feedbackCount: number;
    createdBy: string;
    createdOn: string;
    publishedDate: string;
    status: InsightStatus;
};

export type CompletedTopic = {
    id: string;
    topicCode: string;
    topicName: string;
    feedbacksCount: number;
    respondentsCount: number;
    initiatedBy: string;
    initiatedByRole: string;
    status: string;
};

export type PublishedInsight = {
    id: string;
    insightCode: string;
    topicId: string;
    topicCode: string;
    topicName: string;
    publishedDate: string;
};

export type PromptResponse = {
    prompt: string;
    messages: UIMessage[];
};

export type InsightDetails = {
    id: string;
    status: InsightStatus;
    topicId: string;
    topicCode: string;
    topicName: string;
    topicChannels: TopicChannels[];
    topicDescription: string;
    topicContent?: string;
    createdBy: string;
    createdOn: string;
    startDate: string;
    endDate: string;
    respondentsCount: number;
    feedbacksCount: number;
    summary?: {
        overview: string[];
        key_points: string[];
        next_steps: string[];
        key_themes: {
            theme: string;
            examples: {
                text: string;
                user_id: string;
                sentiment: string;
                feedback_id: string;
            }[];
            mentions: number;
            sentiment: string;
            business_impact: string;
            recommendations: string[];
        }[];
        implementation_strategy?: {
            long_term: string[];
            medium_term: string[];
            short_term: string[];
        };
        summary_documents?: {
            type: string;
            file_name: string;
            feedback_code: string;
            document_short_summary: string;
        }[];
    };
    contradiction?: {
        contradictions?: {
            impact: string;
            severity: string;
            excerpt_a: string;
            excerpt_b: string;
            resolution: string;
            title: string;
            description: string;
            participants: string[];
            feedback_id_a: string;
            feedback_code_a: string;
            feedback_id_b: string;
            feedback_code_b: string;
        }[];
        contradiction_summary: string;
    };
    sentiment?: {
        sentiment_executive_summary: string;
        sentiment_analysis: {
            distribution: {
                neutral: number;
                negative: number;
                positive: number;
            };
            overall_sentiment_score: number;
            sentiment_matrix: {
                low: {
                    neutral: number;
                    negative: number;
                    positive: number;
                };
                high: {
                    neutral: number;
                    negative: number;
                    positive: number;
                };
                medium: {
                    neutral: number;
                    negative: number;
                    positive: number;
                };
                explanation: string;
            };
        };
        feedback_highlights?: {
            text: string;
            theme: string;
            user_id: string;
            display_name: string;
            sentiment: string;
            timestamp: Date;
            highlight_id: string;
            feedback_id: string;
            feedback_code: string;
        }[];
    };
    findings?: {
        findings: {
            impact: string;
            priority: string;
            key_learning: string;
            lesson_title: string;
            applicability: string;
            recommendations: string[];
            implementation_cost: string;
            supporting_evidences: {
                feedback_id: string;
                summarized_message: string;
            }[];
            potential_questions: {
                question: string;
                context_of_question: string;
            }[];
        }[];
        findings_summary: string;
    };
};
