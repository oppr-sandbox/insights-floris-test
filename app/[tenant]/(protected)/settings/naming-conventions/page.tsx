import { HierarchicalIDSystemHelp } from "@/components/pages/settings/naming-conventions/components/hierarchical-id-system-help";
import { NamingConventionsForm } from "@/components/pages/settings/naming-conventions/components/naming-conventions-form";
import { NamingConventionsProvider } from "@/components/pages/settings/naming-conventions/hooks/useNamingConventions";

export default function NamingConventionsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <HierarchicalIDSystemHelp />
            <NamingConventionsProvider>
                <NamingConventionsForm />
            </NamingConventionsProvider>
        </div>
    )
}