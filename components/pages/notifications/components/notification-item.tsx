import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BellPlus, ChartBar, CircleCheckBig, Clock, ExternalLink, Hourglass, Pause, X } from "lucide-react";
import { NotificationData, NotificationStatusUpdatePayload } from "../data/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { JSX } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdownTemplate } from "@/utils/renderMarkdownTemplate";
import moment from "moment";
import { useNotificationStatusUpdate } from "../hooks/useNotificationStatusUpdate";
import { cn } from "@/lib/utils";
import { useUserDetails } from "@/providers/UserContextProvider";

interface NotificationItemProps {
    notification: NotificationData;
    selectedNotifications: string[];
    setSelected: (id: string) => void;
    isMobile: boolean;
}

export default function NotificationItem({ notification, selectedNotifications, setSelected, isMobile }: NotificationItemProps) {
    const { isSaving, updateNotificationStatusAsync } = useNotificationStatusUpdate();
    const { tenant } = useUserDetails();
    const router = useRouter();

    const notificationBorder = notification.readDate ? '' : 'border-primary hover:border-primary/60 border-l-4';

    const notificationIcon: Record<string, JSX.Element> = {
        'new-topic-assigned': <BellPlus size={isMobile ? 14 : 16} />,
        'topic-completed': <CircleCheckBig size={isMobile ? 14 : 16} />,
        'feedback-reminder-due-days': <Clock size={isMobile ? 14 : 16} />,
        'feedback-reminder-ending-soon': <Hourglass size={isMobile ? 14 : 16} />,
        'insights-generated': <ChartBar size={isMobile ? 14 : 16} />,
    }

    const handleNotificationClicked = async (notification: NotificationData) => {
        const topicCode: string = notification.payload.topic.topic_code;
        const insightCode: string = notification.payload.topic.insight_code;
        const payload: NotificationStatusUpdatePayload = {
            notificationIds: [notification.id],
            markAsRead: true
        }

        if (notification.readDate === null) {
            await updateNotificationStatusAsync(payload);
        }

        if (notification.type === 'insights-generated' && insightCode) {
            router.push(`/${tenant}/insights/${insightCode}`);
        } else {
            router.push(`/${tenant}/topics/${topicCode}`);
        }
    }

    if (isMobile) {
        return (
            <div className="cursor-pointer">
                <Card className={cn("py-4", notificationBorder)}>
                    <CardHeader>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                        id={notification.id}
                                        className="cursor-pointer"
                                        checked={selectedNotifications.includes(notification.id)}
                                        onCheckedChange={() => setSelected(notification.id)} />

                                    <div className="rounded-md p-2.5 md:p-4 bg-tertiary/20">
                                        {notificationIcon[notification.type]}
                                    </div>
                                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                                        {moment(notification.createdDate).fromNow()}
                                    </CardDescription>
                                </div>
                                <div>
                                    <Button
                                        className="bg-transparent text-accent-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClicked(notification);
                                        }}>
                                        <ExternalLink />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex-1">
                                    <CardTitle className={`text-lg tabular-nums @[250px]/card:text-xl ${notification.readDate ? 'font-normal text-muted-foreground' : 'font-semibold'}`}>
                                        {renderMarkdownTemplate(notification.title, notification.payload)}
                                    </CardTitle>
                                    <CardDescription className="font-normal">
                                        {renderMarkdownTemplate(notification.description, notification.payload)}
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="cursor-pointer">
            <Card className={cn("py-4", notificationBorder)}>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Checkbox className="cursor-pointer"
                            id={notification.id}
                            checked={selectedNotifications.includes(notification.id)}
                            onCheckedChange={() => setSelected(notification.id)} />

                        <div className="rounded-md p-4 bg-tertiary/20">
                            {notificationIcon[notification.type]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                                <div className="flex-1">
                                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                                        {moment(notification.createdDate).fromNow()}
                                    </CardDescription>
                                    <CardTitle className={`text-lg tabular-nums @[250px]/card:text-xl ${notification.readDate ? 'font-normal text-muted-foreground' : 'font-semibold'}`}>
                                        {renderMarkdownTemplate(notification.title, notification.payload)}
                                    </CardTitle>
                                    <CardDescription className="font-normal">
                                        {renderMarkdownTemplate(notification.description, notification.payload)}
                                    </CardDescription>
                                </div>
                                <div>
                                    <Button
                                        className="bg-transparent text-accent-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClicked(notification);
                                        }}>
                                        <ExternalLink />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}