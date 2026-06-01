export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
    today: number;
    responseRate: number;
}

export interface NotificationData {
    id: string;
    payload: any;
    title: string;
    description: string;
    type: string;
    createdDate: string;
    readDate: string | null;
}

export interface NotificationStatusUpdatePayload {
    notificationIds: string[];
    markAsRead: boolean;
}
