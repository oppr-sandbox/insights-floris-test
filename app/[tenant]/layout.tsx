import { ReactNode } from "react";

export default async function TenantLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ tenant: string }>
}) {
        
    const tenant = (await params).tenant
    const dynamicManifestUrl = '/api/manifest.webmanifest?tenant=' + tenant; 

    return (

        <>
            <link rel="manifest" href={dynamicManifestUrl} />
            {children}
        </>
    );
}
