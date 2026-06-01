import ResetPassswordForm from "@/components/pages/reset-password/components/reset-password-form";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
    searchParams,
    params,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    params: Promise<{ tenant: string }>;
}) {
    const token = (await searchParams).token as string;
    const tenant = (await params).tenant as string;

    if (!token) {
        redirect('/error')
    }

    return (
        <ResetPassswordForm tenant={tenant} accessToken={token} refreshToken={token} />
    )
}