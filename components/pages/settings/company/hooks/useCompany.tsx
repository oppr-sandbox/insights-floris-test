import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { CompanyDetails, CompanyInput, Country, Language } from "../data/schema";
import { toast } from "@/components/ui/sonner";

export const useCompany = () => {
    const detailsData = useQuery(api.company.get);
    const details = detailsData as unknown as CompanyDetails | undefined;
    const isLoading = detailsData === undefined;

    const languagesData = useQuery(api.reference.languages);
    const languages = (languagesData ?? []) as unknown as Language[];
    const isLoadingLanguages = languagesData === undefined;

    const countriesData = useQuery(api.reference.countries);
    const countries = (countriesData ?? []) as unknown as Country[];
    const isLoadingCountries = countriesData === undefined;

    const updateCompany = useMutation(api.company.update);
    const [isSaving, setIsSaving] = useState(false);

    const updateDetailsAsync = async (data: CompanyInput) => {
        setIsSaving(true);
        try {
            await updateCompany({
                name: data.companyName,
                companyEmail: data.companyEmail,
                phone: data.companyPhone,
                street: data.street,
                postalCode: data.postalCode,
                city: data.city,
            });
            toast.success('Company details has been updated.');
        } catch (e) {
            toast.error('Failed to update company details', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isLoading,
        details,

        isLoadingLanguages,
        languages,

        isLoadingCountries,
        countries,

        isSaving,
        updateDetailsAsync
    }
}