'use client';

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/providers/UserContextProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone } from "lucide-react";

type StatusColor = "default" | "success" | "warning" | "muted" | "destructive";

const STATUS_COLOR: Record<string, StatusColor> = {
  ACTIVE: "success",
  PUBLISHED: "default",
  PAUSED: "warning",
};

type RunningTopic = {
  id: string;
  topicCode: string;
  name: string;
  status: string;
  progress: number;
  respondentsCount: number;
  totalRespondentsCount: number;
  totalFeedbacksCount: number;
  initiatedBy: string;
};

export default function RunningTopics() {
  const { tenant, user } = useUserDetails();
  const isManager = user.role.toUpperCase() !== "MEMBER";
  const topics = useQuery(api.topics.running, {}) as RunningTopic[] | undefined;

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
        title="No running topics"
        description={isManager
          ? "Topics that are published, active or paused show up here."
          : "Topics you're part of will appear here while they're running."}
      />
    );
  }

  const card = (t: RunningTopic) => (
    <Card className="h-full transition hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{t.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t.topicCode} · {t.initiatedBy}
          </p>
        </div>
        <Badge color={STATUS_COLOR[t.status] ?? "muted"} variant="outline" className="shrink-0">
          {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t.respondentsCount}/{t.totalRespondentsCount} responded</span>
          <span>{t.totalFeedbacksCount} feedback</span>
        </div>
        <Progress value={t.progress} />
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((t) =>
        isManager ? (
          <Link key={t.id} href={`/${tenant}/topics/${t.topicCode}`}>
            {card(t)}
          </Link>
        ) : (
          <div key={t.id}>{card(t)}</div>
        ),
      )}
    </div>
  );
}
