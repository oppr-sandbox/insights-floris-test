"use client"

import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { NamingConventionInput, namingConventionSchema, initialValues, Location } from "../data/schema"
import { useNamingConventions } from "../hooks/useNamingConventions"

export default function LocationForm({ onAdd, onCancel }: { onAdd: (val: any) => void, onCancel: () => void }) {

    const { isSavingLocation, saveLocationAsync } = useNamingConventions();

    const locationsForm = useForm<NamingConventionInput>({
        resolver: zodResolver(namingConventionSchema),
        defaultValues: initialValues,
        mode: "onChange",
    });

    const handleSaveLocationClick = async () => {
        const data = locationsForm.getValues();
        const locId = await saveLocationAsync(data);
        const location: Location = {
            id: locId,
            name: data.name,
            code: data.code
        }
        locationsForm.reset();
        onAdd(location);
    }

    return (
        <FormProvider {...locationsForm} >
            <div className="space-y-2">
                <div className="h-full">
                    <FormField
                        control={locationsForm.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="code">Code<span className="text-destructive">*</span></Label>
                                <FormControl>
                                    <Input {...field} onChange={(e) => field.onChange(e.target.value.trim().toUpperCase())} />
                                </FormControl>
                                <FormMessages />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="h-full">
                    <FormField
                        control={locationsForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="name">Name<span className="text-destructive">*</span></Label>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessages />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSavingLocation}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" onClick={handleSaveLocationClick} disabled={isSavingLocation}>
                        Add
                    </Button>
                </div>
            </div>
        </FormProvider>
    )
}