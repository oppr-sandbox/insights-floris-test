"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initialValues, NamingConventionInput, namingConventionSchema } from "../data/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { useNamingConventions } from "../hooks/useNamingConventions";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";

export function NamingConventionsForm() {
    const {
        isLoadingLocations,
        locations,
        isSavingLocation,
        saveLocationAsync,
        isDeletingLocation,
        deleteLocationAsync,
        isLoadingDisciplines,
        disciplines,
        isSavingDiscipline,
        saveDisciplineAsync,
        isDeletingDiscipline,
        deleteDisciplineAsync
    } = useNamingConventions();

    const locationsForm = useForm<NamingConventionInput>({
        resolver: zodResolver(namingConventionSchema),
        defaultValues: initialValues,
        mode: "onChange",
    });

    const disciplinesForm = useForm<NamingConventionInput>({
        resolver: zodResolver(namingConventionSchema),
        defaultValues: initialValues,
        mode: "onChange",
    });

    const handleSaveLocationClick = async () => {
        const data = locationsForm.getValues();
        await saveLocationAsync(data);
        locationsForm.reset();
    }

    const handleSaveDisciplinenClick = async () => {
        const data = disciplinesForm.getValues();
        await saveDisciplineAsync(data);
        disciplinesForm.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Global Location & Discipline Codes</CardTitle>
                <CardDescription>These codes are used across all entity types in your hierarchical ID system</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        <CardTitle>Location Codes</CardTitle>
                        <CardDescription>Geographic or organizational locations (e.g., AMS for Amsterdam)</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {isLoadingLocations &&
                            <>
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                            </>
                        }
                        {locations && locations.map((data) =>
                            <div className="bg-accent/50 dark:bg-primary/50 border border-transparent rounded-full flex items-center gap-2 px-2.5 py-1" key={data.id}>
                                <span className="font-semibold">{data.code}</span> - <span>{data.name}</span>
                                <ConfirmationDialog
                                    title="Confirm Action"
                                    description={`Are you sure you want to delete the location ${data.code} - ${data.name}?`}
                                    triggerButton={
                                        <Button disabled={isLoadingLocations || isDeletingLocation}
                                            variant="ghost"
                                            className="rounded-full !px-1"
                                            size="xs">
                                            <X />
                                        </Button>
                                    }
                                    actionButtonText="Confirm"
                                    onActionButtonClicked={() => deleteLocationAsync(data.id)}>
                                </ConfirmationDialog>
                            </div>
                        )}
                    </div>
                    <FormProvider {...locationsForm} >
                        <div className="grid xl:grid-cols-3 gap-2">
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
                            <div className="flex items-start xl:pt-5.5">
                                <Button
                                    className="w-full xl:w-10 h-9 rounded-md"
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    disabled={isSavingLocation}
                                    onClick={handleSaveLocationClick}>
                                    <Plus />
                                </Button>
                            </div>
                        </div>
                    </FormProvider>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        <CardTitle>Discipline Codes</CardTitle>
                        <CardDescription>Departments or functional areas (e.g., HR for Human Resources)</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {isLoadingDisciplines &&
                            <>
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                                <Skeleton className="h-8.5 w-44 rounded-full" />
                            </>
                        }
                        {disciplines && disciplines.map((data) =>
                            <div className="bg-accent/50 dark:bg-primary/50 border border-transparent rounded-full flex items-center gap-2 px-2.5 py-1" key={data.id}>
                                <span className="font-semibold">{data.code}</span> - <span>{data.name}</span>
                                <ConfirmationDialog
                                    title="Confirm Action"
                                    description={`Are you sure you want to delete the discipline ${data.code} - ${data.name}?`}
                                    triggerButton={
                                        <Button disabled={isLoadingDisciplines || isDeletingDiscipline}
                                            variant="ghost"
                                            className="rounded-full !px-1"
                                            size="xs">
                                            <X />
                                        </Button>
                                    }
                                    actionButtonText="Confirm"
                                    onActionButtonClicked={() => deleteDisciplineAsync(data.id)}>
                                </ConfirmationDialog>
                            </div>
                        )}
                    </div>
                    <Form {...disciplinesForm}>
                        <form className="grid xl:grid-cols-3 gap-2">
                            <div className="h-full">
                                <FormField
                                    control={disciplinesForm.control}
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
                                    control={disciplinesForm.control}
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
                            <div className="flex items-start xl:pt-5.5">
                                <Button
                                    className="w-full xl:w-10 h-9 rounded-md"
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    disabled={isSavingDiscipline}
                                    onClick={handleSaveDisciplinenClick}>
                                    <Plus />
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    )
}