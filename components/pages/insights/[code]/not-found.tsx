import ErrorState from "@/components/ui/error-state";
import { redirect } from "next/navigation";

export default function NotFound() {
    return (
        <ErrorState 
            title="Record not found"
            message="Oops, it looks like the record you're looking for doesn't exist."
            action={() => redirect('/insights')}
            actionText="Go back to Insights Page"
        />
    );
}