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
import { createHttpClient } from "@/utils/api/createHttpClient";
import { useQuery } from "@tanstack/react-query";
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

type SubscriptionInfo = {
    plan: string;
    status: string;
    hasActiveSubscription: boolean;
};

type GetUserDetailsResponse = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    lastLogin: string;
    phoneNumber?: string;
    disciplineId?: string;
    discipline?: string;
    locationId?: string;
    location?: string;
    tenant: Tenant;
    subscription?: SubscriptionInfo;
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

export type Tenant = {
    tenantId: string;
    role: string;
    userImage: string;
};

const UserContext = createContext<UserDetails | null>(null);

export const UserContextProvider: React.FC<{
    tenant: string;
    children: ReactElement;
}> = ({ tenant, children }) => {

    const httpClient = createHttpClient({
        'X-Tenant': tenant
    });

    const { data, error, isLoading, refetch } = useQuery<GetUserDetailsResponse>({
        queryKey: ["profile", "me", tenant],
        queryFn: () => httpClient.get("/api/users/me"),
        enabled: !!tenant,
    });

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!data) return;

        const tenantInfo = data.tenant as Tenant | undefined;

        const baseUser = {
            id: data.id,
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            email: data.email ?? "",
            phone: data.phoneNumber ?? "",
            lastLogin: data.lastLogin ?? "",
            companyId: tenantInfo!.tenantId,
            avatar: tenantInfo!.userImage ?? "",
            role: tenantInfo!.role ?? "",
            disciplineId: data.disciplineId,
            locationId: data.locationId,
        };

        setUser(baseUser);

        const deploymentEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? "dev";
        const distinctId = `${data.id}_${deploymentEnv}`;

        posthog.identify(distinctId, {
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            role: tenantInfo!.role,
            deployment: deploymentEnv,
        });

        posthog.group("company", `${tenantInfo!.tenantId}_${deploymentEnv}`, {
            name: tenant,
            deployment: deploymentEnv,
        });

    }, [data, tenant]);

    const role = user?.role ?? "";

    const allowedPages = useMemo(() => {
        return routePermissions[role.toUpperCase()] ?? [];
    }, [role]);

    const hasPermission = useCallback(
        (permission: string) => {
            const userPermissions = permissions[role.toUpperCase()];
            if (userPermissions) {
                return userPermissions.includes(permission);
            }
            return false;
        },
        [role]
    );

    const updateUserAvatar = (newAvatar: string) => {
        setUser((prev) => (prev ? { ...prev, avatar: newAvatar } : prev));
    };

    const hasActiveSubscription = data?.subscription?.hasActiveSubscription ?? false;

    if (isLoading || !user) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <>{children}</>;
    }

    return (
        <UserContext.Provider
            value={{
                user,
                tenant,
                error,
                isLoading,
                refetch,
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

// Custom hook for convenience
export const useUserDetails = () => {
    const context = useContext(UserContext);
    if (!context)
        throw new Error("useUserDetails must be used within a UserContextProvider");
    return context;
};
