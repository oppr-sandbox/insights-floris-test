import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, Lightbulb, TrendingUp } from "lucide-react";

export type FindingsStats = {
    totalFindings: number;
    highPriority: number;
    highImpact: number;
}

export default function FindingsCards({ stats }: { stats: FindingsStats }) {

    return (
        <div className="grid lg:grid-cols-3 gap-4">
            <Card className="py-4 justify-center">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        Total Findings
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.totalFindings}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-warning/20">
                            <Lightbulb />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        High Priority
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.highPriority}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-destructive/20">
                            <CircleAlert />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="py-4">
                <CardHeader>
                    <CardDescription className="text-muted-foreground font-semibold">
                        High Impact
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.highImpact}
                    </CardTitle>
                    <CardAction>
                        <div className="rounded-md p-4 bg-success/20">
                            <TrendingUp />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
        </div>
    )
}