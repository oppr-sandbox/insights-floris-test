import ChangePassswordForm from "@/components/pages/settings/account/components/change-password-form";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
    searchParams,
    params
}: {
    params: Promise<{ tenant: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const tenant = (await params).tenant;
    const token = (await searchParams).token as string;

    if (!token || !tenant) {
        redirect('/error')
    }

    return (
        <ChangePassswordForm tenant={tenant} token={token} />
    )
}