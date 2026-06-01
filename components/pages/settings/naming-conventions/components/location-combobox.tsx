"use client"

import { useNamingConventions } from "../hooks/useNamingConventions"
import { GenericCombobox } from "@/components/ui/generic-combo-box"
import LocationForm from "./location-form"

export default function LocationCombobox({ onChange, value }: { onChange: (...event: any[]) => void, value?: string }) {
    const { locations } = useNamingConventions();

    return (
        <GenericCombobox
            items={locations}
            placeholder="Select location"
            value={value}
            getValue={(item) => item.id}
            getLabel={(item) => `${item.code} - ${item.name}`}
            onChange={onChange}
            renderAddForm={(onAdd, onCancel) => (
                <LocationForm onAdd={onAdd} onCancel={onCancel} />
            )}
        />
    )
}