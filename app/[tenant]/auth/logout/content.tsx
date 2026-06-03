'use client';

import { useEffect } from "react";
import posthog from "posthog-js";
import { useAuthActions } from "@convex-dev/auth/react";
import Loading from "./loading";

export const Content = ({ tenant } : { tenant: string }) => {
    const { signOut } = useAuthActions();

    useEffect(() => {
        signOut().finally(() => {
            posthog.reset();
            window.location.replace(`/${tenant}/login`);
        });
    }, [tenant, signOut])

    return <Loading />
}
