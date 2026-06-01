"use client"

import { useNamingConventions } from "../hooks/useNamingConventions"
import { GenericCombobox } from "@/components/ui/generic-combo-box"
import DisciplineForm from "./discipline-form";

export default function DisciplineCombobox({ onChange, value }: { onChange: (...event: any[]) => void, value?: string }) {
    const { disciplines } = useNamingConventions();

    return (
        <GenericCombobox
            items={disciplines}
            placeholder="Select discipline"
            value={value}
            getValue={(item) => item.id}
            getLabel={(item) => `${item.code} - ${item.name}`}
            onChange={onChange}
            renderAddForm={(onAdd, onCancel) => (
                <DisciplineForm onAdd={onAdd} onCancel={onCancel} />
            )}
        />
    )
}