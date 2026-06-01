import { Button } from "@/components/ui/button";

type ErrorProps = {
    title: string;
    message: string;
    action?: () => void;
    actionText?: string;
}

export default function ErrorState({ title, message, action, actionText } : ErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md text-center">
                <div className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    {message}
                </p>
                {
                    action && (
                        <div className="mt-6">
                            <Button onClick={action}>
                                {actionText ?? 'Retry'}
                            </Button>
                        </div>
                    )
                }
            </div>
        </div>
    )
}