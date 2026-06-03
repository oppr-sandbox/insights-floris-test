"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserDetails } from "@/providers/UserContextProvider";
import { ModelsTab } from "./models-tab";
import { InsightLab } from "./insight-lab";
import { LensesTab } from "./lenses-tab";

export function ConfigPage() {
  const { allowedPages } = useUserDetails();

  if (!allowedPages.includes("/config")) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">
          You don&apos;t have access to this page.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      <div className="py-2">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Command Center
        </h3>
        <p className="text-muted-foreground text-sm">
          Inspect the AI models and stress-test how insights are generated.
        </p>
      </div>

      <Tabs defaultValue="lab">
        <TabsList>
          <TabsTrigger value="lab">Insight Lab</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="lenses">Lenses</TabsTrigger>
        </TabsList>
        <TabsContent value="lab" className="mt-4">
          <InsightLab />
        </TabsContent>
        <TabsContent value="models" className="mt-4">
          <ModelsTab />
        </TabsContent>
        <TabsContent value="lenses" className="mt-4">
          <LensesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
