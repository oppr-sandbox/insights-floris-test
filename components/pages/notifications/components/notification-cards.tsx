import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationStats } from "../data/schema";
import { Bell, CircleCheck, Clock, TrendingUp } from "lucide-react";

export default function NotificationCards({ notificationStats }: { notificationStats: NotificationStats }) {

    return (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Total Notifications
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {notificationStats.total}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-2.5 bg-tertiary/20">
                            <Bell className="text-tertiary-foreground size-5" />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Unread
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {notificationStats.unread}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-2.5 bg-warning/20">
                            <Clock className="text-warning-foreground size-5" />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Today
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {notificationStats.today}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-2.5 bg-success/20">
                            <TrendingUp className="text-success-foreground size-5" />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Response Rate
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {notificationStats.responseRate ? `${(notificationStats.responseRate * 100)}%` : '-'}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-2.5 bg-primary/20">
                            <CircleCheck className="text-primary size-5" />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
        </div>
    )
}