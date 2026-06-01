import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/utils/helpers/helpers";
import { Calendar, Clock, MessageSquare, Text, Users } from "lucide-react";
import { InsightDetails } from "../data/schema";
import Feedbacks from "./feedbacks";
import Attachments from "./attachments";
import { useMemo } from "react";
import { SerializedEditorState, SerializedLexicalNode, SerializedRootNode } from "lexical";
import { ReadonlyEditor } from "@/components/editor/blocks/readonly-editor/editor";
import { EmptyState } from "@/components/ui/empty-state";

export default function Overview({ insightDetails }: { insightDetails: InsightDetails }) {

    const content = useMemo(() => {
        try {
            if (insightDetails) {

                let serializedState: SerializedEditorState | undefined = undefined;

                if (typeof insightDetails.topicContent === "string" && insightDetails.topicContent.trim() !== "") {
                    serializedState = JSON.parse(insightDetails.topicContent) as SerializedEditorState;
                }
                else {
                    serializedState = insightDetails.topicContent as SerializedEditorState | undefined;
                }

                if (serializedState) {
                    const isEmpty = serializedState.root.children.length === 0 ||
                        serializedState.root.children
                            .flatMap(c => (c as SerializedRootNode<SerializedLexicalNode>).children).length === 0;

                    if (isEmpty)
                        return undefined;
                }

                return serializedState;
            }
            else {
                return undefined;
            }
        } catch {
            return undefined;
        }
    }, [insightDetails]);

    return (
        <TabsContent value="overview">
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Topic Overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex flex-col space-y-1">
                                    <div className="flex flex-row gap-2 items-center text-xs">
                                        <Calendar size={14} />
                                        Topic ID
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {insightDetails.topicCode}
                                    </span>
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <div className="flex flex-row gap-2 items-center text-xs">
                                        <Users size={14} />
                                        Creator
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {insightDetails.createdBy}
                                    </span>
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <div className="flex flex-row gap-2 items-center text-xs">
                                        <Clock size={14} />
                                        Duration
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {formatDate(insightDetails.startDate) + ' - ' + formatDate(insightDetails.endDate)}
                                    </span>
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <div className="flex flex-row gap-2 items-center text-xs">
                                        <MessageSquare size={14} />
                                        Engagement
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {`${insightDetails.respondentsCount} respondents, ${insightDetails.feedbacksCount} feedbacks`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Description
                                </span>
                                <span>
                                    {insightDetails.topicDescription}
                                </span>
                            </div>

                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Content
                                </span>
                                {
                                    content ? (
                                        <ReadonlyEditor
                                            editorSerializedState={content}
                                            className="overflow-auto" />
                                    ) : (
                                        <EmptyState
                                            title="No Content"
                                            description="No content has been added yet for this topic."
                                            icons={[Text]}
                                        />
                                    )
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Attachments topicId={insightDetails.topicId} />

                <Feedbacks insightId={insightDetails.id} />
            </div>
        </TabsContent>
    )
}