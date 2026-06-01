"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function RegistrationCompleteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session information.");
      setCompleting(false);
      return;
    }

    completeRegistration(sessionId);
  }, [sessionId]);

  async function completeRegistration(sid: string) {
    setCompleting(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/registration/complete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err?.message ?? "Failed to complete registration.");
        setCompleting(false);
        return;
      }

      const result = await res.json();
      window.location.href = `/${result.slug}/dashboard`;
    } catch {
      setError("Something went wrong. Please try again.");
      setCompleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {completing ? "Setting up your organization..." : "Registration"}
        </CardTitle>
        {completing && (
          <CardDescription>
            Please wait while we finish setting everything up.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {completing && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

        {error && (
          <>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {sessionId && (
              <Button onClick={() => completeRegistration(sessionId)}>
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Back to Home
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function RegistrationCompletePage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <RegistrationCompleteContent />
    </Suspense>
  );
}
