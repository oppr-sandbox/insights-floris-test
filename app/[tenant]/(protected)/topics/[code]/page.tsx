import Details from "@/components/pages/topics/[code]/details"

export default async function DetailsPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params

    return <Details code={code} />
}