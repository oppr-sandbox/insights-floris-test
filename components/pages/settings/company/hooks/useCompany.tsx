import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CompanyDetails, CompanyInput, Country, Language } from "../data/schema";
import { toast } from "@/components/ui/sonner";

export const useCompany = () => {
    const httpClient = createHttpClient();

    const { data: details, isLoading } = useQuery<CompanyDetails>({
        queryKey: ['settings', 'company'],
        queryFn: () => httpClient.get('/api/company')
    });

    const { data: languages, isLoading: isLoadingLanguages } = useQuery<Language[]>({
        queryKey: ['settings', 'company', 'languages'],
        queryFn: () => httpClient.get('/api/languages')
    });

    const { data: countries, isLoading: isLoadingCountries } = useQuery<Country[]>({
        queryKey: ['settings', 'company', 'countries'],
        queryFn: () => httpClient.get('/api/countries')
    });

    const { isPending: isSaving, mutateAsync: updateDetailsAsync } = useMutation({
        mutationFn: (data: CompanyInput) => httpClient.patch(`/api/company`, data),
        onSuccess: () => {
            toast.success('Company details has been updated.');
        },
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Failed to update company details due to the following error: `, {
                    description: validationMessages && validationMessages.length > 0 ? (
                        <ul className="ml-4 list-disc">
                            {validationMessages.map((msg, index) => (
                                <li key={index} className='text-xs'>{msg}</li>
                            ))}
                        </ul>
                    ) : (
                        'Please fill all required fields.'
                    )
                });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

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