'use client';

import { useState } from "react";
import Link from "next/link";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/providers/UserContextProvider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, ListChecks, Megaphone, MessageSquareIcon } from "lucide-react";

import AssignedTopics from "@/components/pages/feedbacks/components/assigned-topics";
import MyFeedbacks from "@/components/pages/feedbacks/components/my-feedbacks";
import NotificationsPage from "@/components/pages/notifications/notifications-page";

type StatusColor = "default" | "success" | "warning" | "muted" | "destructive";

const STATUS_COLOR: Record<string, StatusColor> = {
  ACTIVE: "success",
  PUBLISHED: "default",
  PAUSED: "warning",
  DRAFT: "muted",
  COMPLETED: "muted",
  ARCHIVED: "muted",
};

type RunningTopic = {
  id: string;
  topicCode: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  respondentsCount: number;
  totalRespondentsCount: number;
  totalFeedbacksCount: number;
};

function RunningTopics() {
  const { tenant } = useUserDetails();
  const topics = useQuery(api.topics.mine, {}) as RunningTopic[] | undefined;

  if (topics === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <EmptyState
        icons={[Megaphone]}
        title="You're not running any topics yet"
        description={"Topics you create appear here with their live status\nand response progress."}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((t) => (
        <Link key={t.id} href={`/${tenant}/topics/${t.topicCode}`}>
          <Card className="h-full transition hover:border-primary/50">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate text-base">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.topicCode}</p>
              </div>
              <Badge color={STATUS_COLOR[t.status] ?? "muted"} variant="outline" className="shrink-0">
                {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t.respondentsCount}/{t.totalRespondentsCount} responded
                </span>
                <span>{t.totalFeedbacksCount} feedback</span>
              </div>
              <Progress value={t.progress} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function MeWorkspace() {
  const { user } = useUserDetails();
  const isManager = user.role.toUpperCase() !== "MEMBER";
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="px-4 space-y-6">
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {user.firstName ? `Hi, ${user.firstName}` : "Me"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isManager
              ? "Topics you're running, feedback you owe, and everything you've submitted."
              : "Feedback you owe, everything you've submitted, and your notifications."}
          </p>
        </div>

        {isManager &&
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Topics you&apos;re running</h4>
            <RunningTopics />
          </section>
        }

        <Tabs defaultValue="assigned" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="assigned">
                <ListChecks className="size-4" />
                Feedback to give
              </TabsTrigger>
              <TabsTrigger value="mine">
                <MessageSquareIcon className="size-4" />
                My feedbacks
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="size-4" />
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="assigned">
            <AssignedTopics />
          </TabsContent>
          <TabsContent value="mine" className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch id="me-show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
              <Label htmlFor="me-show-completed">Show completed</Label>
            </div>
            <MyFeedbacks showCompleted={showCompleted} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsPage embedded />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default function MePage() {
  return <MeWorkspace />;
}
