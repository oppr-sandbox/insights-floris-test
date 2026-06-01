// import { redis } from '@/lib/redis';

import { createHttpClient } from "@/utils/api/createHttpClient";

type SubdomainData = {
    tenantId: string;
    tenantName: string;
    logo: string;
    createdAt: number;
};

export async function getSubdomainData(
    subdomain: string
): Promise<SubdomainData | null> {
    const sanitizedSubdomain = subdomain
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");

    try {
        const httpClient = createHttpClient();
        const response = await httpClient.get<SubdomainData>(
            `/api/tenants/${sanitizedSubdomain}/site-details`
        );

        return response;
    } catch (error) {
        return null;
    }
}

export async function getAllSubdomains() {
    const keys: string[] = [];

    if (!keys.length) {
        return [];
    }

    const values: SubdomainData[] = [];

    return keys.map((key: string, index: number) => {
        const subdomain = key.replace("subdomain:", "");
        const data = values[index];

        return {
            subdomain,
            logo: data?.logo || "❓",
            createdAt: data?.createdAt || Date.now(),
        };
    });
}
