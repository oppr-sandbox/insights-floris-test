import { MessageSquare, Lightbulb, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderMarkdownTemplate } from "@/utils/renderMarkdownTemplate"
import { Activity } from "../data/schema"

export default function ActivityItem({ activity }: { activity: Activity }) {

    const renderIcon = (type: 'submitted-feedback' | 'generated-insights') => {
        if (type === 'submitted-feedback') {
            return (
                <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                    <MessageSquare className="text-primary size-5" />
                </div>
            )
        }
        else {
            return (
                <div className="p-2 bg-warning/20 rounded-md flex-shrink-0">
                    <Lightbulb className="text-warning size-5" />
                </div>
            )
        }
    }

    return (
        <div className="flex items-start gap-8 justify-between p-2 border border-border-grey rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-2">
                {renderIcon(activity.type)}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-grey">
                        {renderMarkdownTemplate(activity.template, activity.metaData)}
                    </p>
                    <p className="text-xs text-muted-foreground">30 minutes ago</p>
                </div>
            </div>
            <Button variant="outline" size="icon" className="size-5">
                <ArrowRight />
            </Button>
        </div>
    )
}
