
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CompanyInput, companySchema } from "../data/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useCompany } from "../hooks/useCompany";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { Combobox } from "@/components/ui/combo-box";
import { PencilIcon, Save, X } from "lucide-react";

export default function CompanyForm({ className, ...props }: React.ComponentProps<"div">) {
    const [readOnly, setReadOnly] = useState<boolean>(true);
    const {
        isLoading,
        details,
        languages,
        countries,
        isSaving,
        updateDetailsAsync
    } = useCompany();

    const form = useForm<CompanyInput>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            companyName: details?.companyName,
            companyEmail: details?.companyEmail ?? '',
            companyPhone: details?.companyPhone ?? '',
            languageId: details?.languageId ?? '',
            street: details?.street ?? '',
            postalCode: details?.postalCode ?? '',
            city: details?.city ?? '',
            countryId: details?.countryId ?? '',
        },
        mode: "onChange"
    })
    const { isDirty, isValid, dirtyFields } = form.formState;
    const hasChanges = Object.keys(dirtyFields).length > 0;

    const handleEditClick = () => {
        setReadOnly(false);
        form.setFocus("companyName");
    }

    const handleCancelClick = () => {
        form.clearErrors();
        setReadOnly(true);
    }

    const handleSaveClick = async () => {
        const formValues = form.getValues();

        const payload: CompanyInput = {
            companyName: formValues.companyName,
            companyEmail: formValues.companyEmail ? formValues.companyEmail : undefined,
            companyPhone: formValues.companyPhone ? formValues.companyPhone : undefined,
            languageId: formValues.languageId ? formValues.languageId : undefined,
            street: formValues.street ? formValues.street : undefined,
            postalCode: formValues.postalCode ? formValues.postalCode : undefined,
            city: formValues.city ? formValues.city : undefined,
            countryId: formValues.countryId ? formValues.countryId : undefined,
        }

        await updateDetailsAsync(payload);
        form.reset(payload);
        setReadOnly(true);
    }

    useEffect(() => {
        if (details) {
            form.reset({
                companyName: details?.companyName,
                companyEmail: details?.companyEmail ?? '',
                companyPhone: details?.companyPhone ?? '',
                languageId: details?.languageId ?? '',
                street: details?.street ?? '',
                postalCode: details?.postalCode ?? '',
                city: details?.city ?? '',
                countryId: details?.countryId ?? '',
            })
        }
    }, [details, form]);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="gap-8">
                <div>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Company Information
                            </CardTitle>
                            <div className="flex justify-end">
                                {readOnly ? (
                                    <div>
                                        <Button type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={isLoading}
                                            onClick={handleEditClick}>
                                            <PencilIcon />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={isLoading || isSaving}
                                            onClick={handleCancelClick}>
                                            <X />
                                        </Button>
                                        <ConfirmationDialog
                                            title="Save Company Details"
                                            description="Are you sure you want to save the changes made to your company profile?"
                                            triggerButton={(
                                                <Button type="button"
                                                    size="icon"
                                                    disabled={isSaving || (isDirty && !isValid) || !hasChanges}>
                                                    <Save />
                                                </Button>
                                            )}
                                            actionButtonText="Save"
                                            onActionButtonClicked={handleSaveClick}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="companyName">Company Name</Label>
                                                    <FormControl>
                                                        <Input {...field}
                                                            className={readOnly ? 'cursor-default' : ''}
                                                            readOnly={readOnly || isLoading || isSaving} />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="companyEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="companyEmail">Company Email</Label>
                                                    <FormControl>
                                                        <Input {...field}
                                                            className={readOnly ? 'cursor-default' : ''}
                                                            readOnly={readOnly || isLoading || isSaving} />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="companyPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="companyPhone">Company Phone</Label>
                                                    <FormControl>
                                                        <Input {...field}
                                                            className={readOnly ? 'cursor-default' : ''}
                                                            readOnly={readOnly || isLoading || isSaving} />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="languageId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="languageId">Language</Label>
                                                    <FormControl>
                                                        <Combobox
                                                            placeholder="Select language..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            disabled={readOnly || isLoading || isSaving}
                                                            items={languages?.map(language => ({
                                                                value: language.id,
                                                                label: `${language.name} (${language.languageCode})`,
                                                            })) ?? []}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        This will be your default language.
                                                    </FormDescription>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </div>

                <div>
                    <CardHeader>
                        <CardTitle className="h-9">Company Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form className="flex flex-col gap-2">
                                <div className="h-full">
                                    <FormField
                                        control={form.control}
                                        name="street"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label htmlFor="street">Street Address</Label>
                                                <FormControl>
                                                    <Input {...field}
                                                        className={readOnly ? 'cursor-default' : ''}
                                                        readOnly={readOnly || isLoading || isSaving} />
                                                </FormControl>
                                                <FormMessages />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="postalCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="postalCode">Postal Code</Label>
                                                    <FormControl>
                                                        <Input {...field}
                                                            className={readOnly ? 'cursor-default' : ''}
                                                            readOnly={readOnly || isLoading || isSaving} />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="city">City</Label>
                                                    <FormControl>
                                                        <Input {...field}
                                                            className={readOnly ? 'cursor-default' : ''}
                                                            readOnly={readOnly || isLoading || isSaving} />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="h-full">
                                        <FormField
                                            control={form.control}
                                            name="countryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="countryId">Country</Label>
                                                    <FormControl>
                                                        <Combobox
                                                            placeholder="Select country..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            disabled={readOnly || isLoading || isSaving}
                                                            items={countries?.map(country => ({
                                                                value: country.id,
                                                                label: `${country.name} (${country.countryCode})`,
                                                            })) ?? []}
                                                        />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </div>
            </Card>
        </div>
    )
}