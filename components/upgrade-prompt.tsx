"use client";

import { useUserDetails } from "@/providers/UserContextProvider";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
    action?: string;
}

export function UpgradePrompt({ action }: UpgradePromptProps) {
    const { hasActiveSubscription, tenant, hasPermission } = useUserDetails();

    if (hasActiveSubscription) return null;

    const message = action
        ? `An active subscription is required to ${action}.`
        : "An active subscription is required to perform this action.";

    const canManageBilling = hasPermission("billing:manage");

    return (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
                {message}{" "}
                {canManageBilling
                    ? "Upgrade your plan to unlock full access."
                    : "Contact your administrator to upgrade."}
            </span>
            {canManageBilling && (
                <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/${tenant}/settings/billing`}>
                        Upgrade Plan
                        <ArrowUpRight className="ml-1 size-3.5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}
