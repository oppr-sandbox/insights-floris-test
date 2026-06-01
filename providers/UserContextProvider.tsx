"use client";

import {
    createContext,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { permissions, routePermissions } from "@/utils/auth/permissions";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import posthog from "posthog-js";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyId: string;
    role: string;
    lastLogin: string;
    avatar: string;
    disciplineId?: string;
    locationId?: string;
};

export type Tenant = {
    tenantId: string;
    role: string;
    userImage: string;
};

export type UserDetails = {
    user: User;
    tenant: string;
    error: Error | null;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
    allowedPages: string[];
    hasPermission: (permission: string) => boolean;
    updateUserAvatar: (newAvatar: string) => void;
    hasActiveSubscription: boolean;
};

const UserContext = createContext<UserDetails | null>(null);

export const UserContextProvider: React.FC<{
    tenant: string;
    children: ReactElement;
}> = ({ tenant, children }) => {
    const data = useQuery(api.users.me);
    const isLoading = data === undefined;

    const [avatarOverride, setAvatarOverride] = useState<string | null>(null);

    useEffect(() => {
        if (!data) return;

        const deploymentEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? "dev";
        const distinctId = `${data.id}_${deploymentEnv}`;

        posthog.identify(distinctId, {
            email: data.email,
            name: data.displayName,
            role: data.role,
            deployment: deploymentEnv,
        });

        if (data.companyId) {
            posthog.group("company", `${data.companyId}_${deploymentEnv}`, {
                name: tenant,
                deployment: deploymentEnv,
            });
        }
    }, [data, tenant]);

    const role = data?.role ?? "";

    const allowedPages = useMemo(() => {
        return routePermissions[role.toUpperCase()] ?? [];
    }, [role]);

    const hasPermission = useCallback(
        (permission: string) => {
            const userPermissions = permissions[role.toUpperCase()];
            return userPermissions ? userPermissions.includes(permission) : false;
        },
        [role]
    );

    const updateUserAvatar = (newAvatar: string) => setAvatarOverride(newAvatar);

    // Billing is out of scope for the sandbox — everyone has full access.
    const hasActiveSubscription = true;

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        // Not authenticated — middleware redirects to login.
        return <>{children}</>;
    }

    const user: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phoneNumber,
        companyId: data.companyId ?? "",
        role: data.role,
        lastLogin: data.lastLogin ? new Date(data.lastLogin).toISOString() : "",
        avatar: avatarOverride ?? data.userImage,
        disciplineId: data.disciplineId ?? undefined,
        locationId: data.locationId ?? undefined,
    };

    return (
        <UserContext.Provider
            value={{
                user,
                tenant,
                error: null,
                isLoading,
                refetch: async () => undefined,
                allowedPages,
                hasPermission,
                updateUserAvatar,
                hasActiveSubscription,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUserDetails = () => {
    const context = useContext(UserContext);
    if (!context)
        throw new Error("useUserDetails must be used within a UserContextProvider");
    return context;
};
