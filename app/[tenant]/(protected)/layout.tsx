import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { notFound } from "next/navigation";
import { UserContextProvider } from "@/providers/UserContextProvider";

export default async function TenantAdminLayout({
    params,
    children,
}: {
    params: Promise<{ tenant: string }>;
    children: React.ReactNode;
}) {
  const { tenant } = (await params);

  if (!tenant) {
    notFound();
  }

  return (
    <UserContextProvider tenant={tenant}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="sidebar" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col flex-1 gap-4 py-4 md:gap-4 md:py-4">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserContextProvider>
  );
}
