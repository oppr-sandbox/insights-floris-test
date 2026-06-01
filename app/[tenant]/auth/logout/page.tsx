import { Content } from "./content"

export default async function LogoutPage ({ params }: { params: Promise<{ tenant: string }>; }) {

    const { tenant } = await params;
    
    return <Content tenant={tenant} />
}