'use client'

import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
    const router = useRouter();

    const handleRedirect = () => {
        router.push('/')
    }

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md text-center">
                <LockIcon className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Unauthorized Access</h1>
                <p className="mt-4 text-muted-foreground">
                    You do not have the necessary permissions to access this resource. Please contact your administrator for
                    assistance.
                </p>
                <Button className="mt-4" onClick={handleRedirect}>
                    Go back
                </Button>
            </div>
        </div>
  )
}
