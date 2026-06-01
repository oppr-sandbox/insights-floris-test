import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { GalleryVerticalEnd } from 'lucide-react'

import { redirect } from 'next/navigation'
import SetupAccountForm from './form'

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {

  const tenant = (await params).tenant;
  const token = (await searchParams).token as string;;

  if (!token || !tenant) {
    redirect('/error')
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Oppr. Insights
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Complete Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <SetupAccountForm tenant={tenant} token={token} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

  )
}