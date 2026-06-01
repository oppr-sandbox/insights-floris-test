import { TopicStatus } from "../../topics/data/schema";

type Status = {
    value: string;
    color: 'default' | 'secondary' | 'success' | 'tertiary' | 'warning'
}

export enum FeedbackStatus {
    Draft = 'DRAFT',
    Submitted = 'SUBMITTED'
} 

export const feedbackStatuses: Record<string, Status> = {
  [FeedbackStatus.Submitted]: {
    value: "Submitted",
    color: "success",
  },
};

export const statuses: Record<TopicStatus, Status> = {
  [TopicStatus.Draft]: {
    value: "Draft",
    color: "warning"
  },
  [TopicStatus.Active]: {
    value: "Active",
    color: "success",
  },
  [TopicStatus.Paused]: {
    value: "Paused",
    color: "default"
  },
  [TopicStatus.Completed]: {
    value: "Completed",
    color: "tertiary"
  },
  [TopicStatus.Published]: {
    value: "Published",
    color: "secondary"
  },
};