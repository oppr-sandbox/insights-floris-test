"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Collapsible } from "@radix-ui/react-collapsible";
import { CircleQuestionMark } from "lucide-react";
import { useState } from "react";

export function HierarchicalIDSystemHelp() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card>
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="flex w-full flex-col gap-2">
                <CollapsibleTrigger asChild>
                    <CardHeader className="flex gap-2 mb-1 items-center cursor-pointer">
                        <CircleQuestionMark size={15} />
                        <CardTitle>
                            Hierarchical ID System Help
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="flex flex-col gap-4">
                        <div className="bg-accent/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">How the Hierarchical System Works:</h4>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <strong>Topic ID:</strong> [Location]-[Discipline]-[Acronym]-[Sequence]
                                </p>
                                <p>
                                    Example: AMS-HR-TOP-0001
                                </p>
                                <p>
                                    <strong>Feedback ID:</strong> [Topic ID]-[Acronym]-[Sequence]
                                </p>
                                <p>
                                    Example: AMS-HR-TOP-0001-FBK-001
                                </p>
                                <p>
                                    <strong>Insight ID:</strong> [Topic ID]-[Acronym]-[Sequence]
                                </p>
                                <p>
                                    Example: AMS-HR-TOP-0001-INS-001
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">Benefits:</h4>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>
                                    <strong>Clarity:</strong> IDs instantly show location, department, and relationships
                                </li>
                                <li>
                                    <strong>Scalability:</strong> Independent sequences prevent conflicts
                                </li>
                                <li>
                                    <strong>Traceability:</strong> Parent-child relationships are built into the ID
                                </li>
                                <li>
                                    <strong>Human-readable:</strong> No need for database lookups to understand context
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}