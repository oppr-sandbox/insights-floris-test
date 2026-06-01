"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoginFlow from "./login-flow";
import SignupFlow from "./signup-flow";

export default function LandingForm() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (canceled) setActiveTab("signup");
  }, [canceled]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome to Oppr Insights</CardTitle>
        <CardDescription>
          Sign in to your organization or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canceled && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Checkout was canceled. You can try again whenever you&apos;re ready.
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Organization</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginFlow />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignupFlow />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
