import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { InsightDetails } from "../data/schema";
import { TopicChannels } from "../../topics/data/schema";
import { channels } from "../../topics/data/data";
import { File } from "lucide-react";

export default function Summary({ insightDetails }: { insightDetails: InsightDetails }) {

    const documentType: Record<string, TopicChannels> = {
        Audio: TopicChannels.Voice,
        Image: TopicChannels.Image,
    }

    const renderDocumentTypeIcon = (c: TopicChannels) => {
        const channel = channels[c];

        if (!channel) return (
            <div className="rounded-sm p-1 bg-muted">
                <File className="size-4 text-dark-grey" />
            </div>
        )

        return (
            <div key={channel.value} className="rounded-sm p-1 bg-muted" title={channel.value}>
                <channel.icon className="size-4 text-dark-grey" />
            </div>
        );
    }

    return (
        <TabsContent value="summary">
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            {
                                insightDetails.summary && (
                                    <ul>
                                        {
                                            insightDetails.summary.overview.map((o, i) => (
                                                <li key={i}>{o}</li>
                                            ))
                                        }
                                    </ul>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Key Themes Identified</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            {
                                insightDetails.summary?.key_themes && (
                                    <ul className="ms-4 list-disc">
                                        {
                                            insightDetails.summary.key_themes.map((o, i) => (
                                                <li key={i}>{o.theme}</li>
                                            ))
                                        }
                                    </ul>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Top Recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            {
                                insightDetails.summary?.implementation_strategy && (
                                    <div className="space-y-4">
                                        {
                                            insightDetails.summary.implementation_strategy.short_term && (
                                                <div className="border-l-4 border-green-500 pl-4">
                                                    <h4 className="text-h4 text-dark-grey font-semibold">Immediate Actions</h4>
                                                    <ul className="list-disc list-inside space-y-1 mt-2">
                                                        {
                                                            insightDetails.summary.implementation_strategy.short_term.map((s, i) => (
                                                                <li key={i} className="text-body text-dark-grey">{s}</li>
                                                            ))
                                                        }
                                                    </ul>
                                                </div>
                                            )
                                        }
                                        <div className="border-l-4 border-blue-500 pl-4">
                                            <h4 className="text-h4 text-dark-grey font-semibold">Medium-term Improvements</h4>
                                            <ul className="list-disc list-inside space-y-1 mt-2">
                                                {
                                                    insightDetails.summary.implementation_strategy.medium_term.map((s, i) => (
                                                        <li key={i} className="text-body text-dark-grey">{s}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Feedback Documents Summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            {
                                insightDetails.summary?.summary_documents && (
                                    <ul className="space-y-4">
                                        {insightDetails.summary.summary_documents.map((d, i) => (
                                            <li key={i}>
                                                <div className="flex gap-2 items-start">
                                                    {renderDocumentTypeIcon(documentType[d.type])}
                                                    <div className="flex flex-col w-full break-words">
                                                        <span className="font-medium">{d.feedback_code}</span>
                                                        <span className="text-sm">
                                                            File Name: <span className="font-medium break-all">{d.file_name}</span>
                                                        </span>
                                                        <span className="text-sm">
                                                            Short Summary: <span className="font-medium italic break-words">{d.document_short_summary}</span>
                                                        </span>
                                                    </div>

                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    )
}