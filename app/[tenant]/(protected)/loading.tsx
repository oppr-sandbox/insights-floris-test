import { Spinner } from "@/components/ui/spinner";

export default function Loading () {
    return (
        <div className="flex flex-1 h-full w-full items-center justify-center">
            <Spinner />
        </div>
    )
}