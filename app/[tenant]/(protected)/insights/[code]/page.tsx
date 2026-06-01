import Details from "@/components/pages/insights/[code]/details"

export default async function ViewPage({ params }: { params: Promise<{ code: string }> }) {

    const { code } = await params

    return <Details code={code} />
}