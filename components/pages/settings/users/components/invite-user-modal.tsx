"use client"

import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Magic-link auth: colleagues self-provision on first sign-in with their
// @oppr.ai email, so there is no invitation to send. This just shares the
// sign-in URL for the current deployment.
export default function InviteUserModal() {
    const handleCopy = async () => {
        const url = window.location.origin;
        try {
            await navigator.clipboard.writeText(url);
            toast.default(
                "Sign-in link copied. Colleagues sign in with their @oppr.ai email — no invite needed.",
            );
        } catch {
            toast.default(`Share this sign-in link: ${url}`);
        }
    };

    return (
        <Button type="button" variant="outline" onClick={handleCopy}>
            <Link2 />
            Copy sign-in link
        </Button>
    );
}
