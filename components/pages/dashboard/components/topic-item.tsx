import { Card, CardHeader, CardDescription, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Topic } from "../data/schema";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { remainingDays } from "@/utils/helpers/helpers";

export default function TopicItem(topic: Topic) {

    const percentage = Math.round((topic.respondentsCount / topic.totalRespondentsCount) * 100);


    const renderRemainingDays = () => {
        const noOfDays = remainingDays(topic.endDate)!;

        if (noOfDays > 5) {
            return <p className="text-success-foreground text-xs font-semibold text-center">{noOfDays} days</p>
        }
        else if (noOfDays <= 5 && noOfDays > 2) {
            return <p className="text-warning-foreground text-xs font-semibold text-center">{noOfDays} days</p>
        }
        else {
            return <p className="text-destructive-foreground text-xs font-semibold text-center">{noOfDays} {noOfDays > 1 ? ' days left' : 'day left'}</p>
        }
    }
    
    return (
        <Card className="gap-4">
            <CardHeader>
                <CardDescription className="text-xs">Topic ID: {topic.topicCode}</CardDescription>
                <CardTitle className="text-sm">{topic.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" color="success">
                            Active
                        </Badge>
                        <div className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            <span className="text-xs">{renderRemainingDays()}</span>
                        </div>
                    </div>

                    <div className="flex flex-1 items-center justify-between">
                        <p className="text-xs text-muted-foreground">Respondent Participation</p>
                        <p className="text-xs text-muted-foreground">
                            {`${topic.respondentsCount}/${topic.totalRespondentsCount} respondents`}
                        </p>
                    </div>

                    <Progress value={percentage} />

                    <p className="text-xs text-muted-foreground">
                        {topic.totalFeedbacksCount} total feedbacks submitted
                    </p>
                </div>
            </CardContent>
            {/* <CardFooter>
                <Link href={`topics/${topic.topicCode}`} className="flex-1">
                    <Button className="w-full" type="button" variant="outline" size="sm">
                        View Topic Details
                    </Button>
                </Link>
            </CardFooter> */}
        </Card>
    )
}