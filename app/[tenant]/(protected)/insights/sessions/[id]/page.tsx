import { SessionWorkspace } from "@/components/pages/analysis/session-workspace";

export default async function InsightSessionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <SessionWorkspace sessionId={id} />;
}
