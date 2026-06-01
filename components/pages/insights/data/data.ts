type Status = {
    value: string;
    color: 'default' | 'success' | 'warning' | 'muted' | 'destructive'
}

export enum InsightStatus {
    Draft = 'DRAFT',
    Published = 'PUBLISHED',
    Generating = 'GENERATING',
    Failed = 'FAILED'
} 

export const statuses: Record<InsightStatus, Status> = {
  [InsightStatus.Draft]: {
    value: "Draft",
    color: "warning"
  },
  [InsightStatus.Published]: {
    value: "Published",
    color: "success",
  },
  [InsightStatus.Generating]: {
    value: "Generating",
    color: "muted",
  },
  [InsightStatus.Failed]: {
    value: "Failed",
    color: "destructive",
  },
};
