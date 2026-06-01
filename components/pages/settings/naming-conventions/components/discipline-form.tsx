"use client"

import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { NamingConventionInput, namingConventionSchema, initialValues, Discipline } from "../data/schema"
import { useNamingConventions } from "../hooks/useNamingConventions"

export default function DisciplineForm({ onAdd, onCancel }: { onAdd: (val: any) => void, onCancel: () => void }) {

    const { isSavingDiscipline, saveDisciplineAsync } = useNamingConventions();

    const disciplineForm = useForm<NamingConventionInput>({
        resolver: zodResolver(namingConventionSchema),
        defaultValues: initialValues,
        mode: "onChange",
    });

    const handleSaveDisciplineClick = async () => {
        const data = disciplineForm.getValues();
        const discId = await saveDisciplineAsync(data);
        const discipline: Discipline = {
            id: discId,
            name: data.name,
            code: data.code
        }
        disciplineForm.reset();
        onAdd(discipline);
    }

    return (
        <FormProvider {...disciplineForm} >
            <div className="space-y-2">
                <div className="h-full">
                    <FormField
                        control={disciplineForm.control}
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
                        control={disciplineForm.control}
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
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSavingDiscipline}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" onClick={handleSaveDisciplineClick} disabled={isSavingDiscipline}>
                        Add
                    </Button>
                </div>
            </div>
        </FormProvider>
    )
}