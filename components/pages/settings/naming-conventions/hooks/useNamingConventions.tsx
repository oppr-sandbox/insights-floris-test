"use client"

import { createContext, ReactNode, useContext, useReducer } from "react";
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Discipline, Location, NamingConventionInput } from "../data/schema";
import { toast } from "@/components/ui/sonner";

type NamingConventionsContextType = {
    isLoadingLocations: boolean;
    locations: Location[];
    isSavingLocation: boolean;
    saveLocationAsync: (data: NamingConventionInput) => Promise<string>;
    isDeletingLocation: boolean;
    deleteLocationAsync: (id: string) => void;

    isLoadingDisciplines: boolean;
    disciplines: Discipline[];
    isSavingDiscipline: boolean;
    saveDisciplineAsync: (data: NamingConventionInput) => Promise<string>;
    isDeletingDiscipline: boolean;
    deleteDisciplineAsync: (id: string) => void;
}

const NamingConventionsContext = createContext<NamingConventionsContextType | undefined>(undefined);

export const NamingConventionsProvider = ({ children }: { children: ReactNode }) => {
    const httpClient = createHttpClient();
    const queryClient = useQueryClient();

    // Location
    const { data: locations, error: errorLocations, isLoading: isLoadingLocations } = useQuery<Location[]>({
        queryKey: ['naming-conventions', 'locations'],
        queryFn: () => httpClient.get('/api/locations')
    });

    const { isPending: isSavingLocation, mutateAsync: saveLocationAsync } = useMutation({
        mutationFn: (data: NamingConventionInput) => httpClient.post<string>(`/api/locations`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Failed to save location due to the following error: `, {
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
        },
        onSuccess: () => {
            toast.success('Location Added', { description: 'The location has been saved successfully.' });
            queryClient.invalidateQueries({ queryKey: ['naming-conventions', 'locations'] })
        }
    });

    const { isPending: isDeletingLocation, mutateAsync: deleteLocationAsync } = useMutation({
        mutationFn: (id: string) => httpClient.delete(`/api/locations/${id}`),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Failed to delete location due to the following error: `, {
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
        },
        onSuccess: () => {
            toast.success('Location Deleted', { description: 'The location was deleted successfuly.' });
            queryClient.invalidateQueries({ queryKey: ['naming-conventions', 'locations'] })
        }
    });

    // Discipline
    const { data: disciplines, error: errorDisciplines, isLoading: isLoadingDisciplines } = useQuery<Discipline[]>({
        queryKey: ['naming-conventions', 'disciplines'],
        queryFn: () => httpClient.get('/api/disciplines')
    });

    const { isPending: isSavingDiscipline, mutateAsync: saveDisciplineAsync } = useMutation({
        mutationFn: (data: NamingConventionInput) => httpClient.post<string>(`/api/disciplines`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Failed to save discipline due to the following error: `, {
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
        },
        onSuccess: () => {
            toast.success('Discipline Added', { description: 'The discipline has been saved successfully.' });
            queryClient.invalidateQueries({ queryKey: ['naming-conventions', 'disciplines'] })
        }
    });

    const { isPending: isDeletingDiscipline, mutateAsync: deleteDisciplineAsync } = useMutation({
        mutationFn: (id: string) => httpClient.delete(`/api/disciplines/${id}`),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Failed to delete discipline due to the following error: `, {
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
        },
        onSuccess: () => {
            toast.success('Discipline Deleted', { description: 'The discipline was deleted successfuly.' });
            queryClient.invalidateQueries({ queryKey: ['naming-conventions', 'disciplines'] })
        }
    });

    return (
        <NamingConventionsContext.Provider value={{
            isLoadingLocations,
            locations: locations ?? [],
            isSavingLocation,
            saveLocationAsync,
            isDeletingLocation: false,
            deleteLocationAsync,

            isLoadingDisciplines,
            disciplines: disciplines ?? [],
            isSavingDiscipline,
            saveDisciplineAsync,
            isDeletingDiscipline: false,
            deleteDisciplineAsync
        }}>
            {children}
        </NamingConventionsContext.Provider>
    );
}

export const useNamingConventions = () => {
    const context = useContext(NamingConventionsContext);

    if (!context) {
        throw new Error('useNamingConventions must be used within a NamingConventionsProvider');
    }

    return context;
};