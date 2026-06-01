'use client';

import { useEffect } from "react";
import posthog from "posthog-js";
import Loading from "./loading";

export const Content = ({ tenant } : { tenant: string }) => {
    
    useEffect(() => {
        function logout () {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/authentication/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                "Content-Type": "application/json",
                "X-Tenant": tenant,
            },
            }).then(() => {
                posthog.reset();
                window.location.replace(`/${tenant}/login`);
            });
        }

        logout();
    }, [tenant])

    return <Loading />
}
