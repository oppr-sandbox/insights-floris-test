import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function Loading () {
    return (
        <div className="flex flex-1 flex-col items-center justify-center h-screen">
            <Card>
                <CardContent className="flex items-center gap-2">
                    <Spinner />
                    <p>Logging out...</p>
                </CardContent>
            </Card>
        </div>
    )
}