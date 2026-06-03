'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserDetails } from "@/providers/UserContextProvider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { MessagesSquare } from "lucide-react";

// Starts a conversation seeded with this insight, anchored to its topic so it
// lists under the topic in the Insights hub.
export default function TalkAboutInsight({
    insightId,
    topicId,
}: {
    insightId: string;
    topicId: string;
}) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const createAsk = useMutation(api.sessions.createAsk);
    const [busy, setBusy] = useState(false);

    const handleTalk = async () => {
        setBusy(true);
        try {
            const res = await createAsk({
                insightIds: [insightId as Id<"insights">],
                scopeTopicId: topicId as Id<"topics">,
            });
            router.push(`/${tenant}/insights/sessions/${res.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not start the conversation");
            setBusy(false);
        }
    };

    return (
        <Button size="sm" variant="outline" onClick={handleTalk} disabled={busy}>
            {busy ? <Spinner className="size-4" /> : <MessagesSquare className="size-4" />}
            Talk
        </Button>
    );
}
