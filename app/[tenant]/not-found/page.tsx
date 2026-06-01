"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex items-center gap-2 text-xl font-bold">
          <img alt="Oppr Logo" className="h-8 w-8" src="/logo.png" />
          Oppr Insights
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-8xl font-bold tracking-tighter text-primary">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href={`/${tenant}/dashboard`}>Go to Dashboard</Link>
        </Button>

        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://oppr.ai"
            className="underline underline-offset-4 hover:text-primary"
          >
            Oppr.ai
          </a>
        </p>
      </div>
    </div>
  );
}

