"use client"

import { useState } from "react";
import { toast } from "sonner";
import { InviteUserInput } from "../data/schema";

// With magic-link auth, users self-provision on first sign-in with an @oppr.ai
// email, so there is no invitation step. This keeps the form's interface intact.
export const useInviteUserForm = () => {
    const [isSaving] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inviteUserAsync = async (_data: InviteUserInput) => {
        toast.message("No invitation needed", {
            description: "Users sign in directly with their @oppr.ai email.",
        });
    };

    return {
        isSaving,
        inviteUserAsync,
    };
};
