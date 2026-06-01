import LoginForm from './login.form';

export default async function LoginPage({
    params,
    searchParams,
}: {
    params: Promise<{ tenant: string }>;
    searchParams: Promise<{ email?: string }>;
}) {
    const { tenant } = await params;
    const { email } = await searchParams;

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex text-xl items-center gap-2 self-center font-bold">
                    <img alt="Oppr Logo" className="h-8 w-8" src="/logo.png" />
                    Oppr Insights
                </a>
                <LoginForm tenant={tenant} defaultEmail={email} />
            </div>
        </div>
    )
}