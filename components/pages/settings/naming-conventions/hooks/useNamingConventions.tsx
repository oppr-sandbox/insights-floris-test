"use client"

import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
    const locationsData = useQuery(api.locations.list);
    const disciplinesData = useQuery(api.disciplines.list);

    const createLocation = useMutation(api.locations.create);
    const removeLocation = useMutation(api.locations.remove);
    const createDiscipline = useMutation(api.disciplines.create);
    const removeDiscipline = useMutation(api.disciplines.remove);

    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [isSavingDiscipline, setIsSavingDiscipline] = useState(false);

    const saveLocationAsync = async (data: NamingConventionInput) => {
        setIsSavingLocation(true);
        try {
            const id = await createLocation({ name: data.name, code: data.code });
            toast.success('Location Added', { description: 'The location has been saved successfully.' });
            return id as string;
        } catch (e) {
            toast.error('Failed to save location', { description: e instanceof Error ? e.message : undefined });
            throw e;
        } finally {
            setIsSavingLocation(false);
        }
    };

    const deleteLocationAsync = async (id: string) => {
        try {
            await removeLocation({ id: id as Id<"locations"> });
            toast.success('Location Deleted', { description: 'The location was deleted successfully.' });
        } catch (e) {
            toast.error('Failed to delete location', { description: e instanceof Error ? e.message : undefined });
        }
    };

    const saveDisciplineAsync = async (data: NamingConventionInput) => {
        setIsSavingDiscipline(true);
        try {
            const id = await createDiscipline({ name: data.name, code: data.code });
            toast.success('Discipline Added', { description: 'The discipline has been saved successfully.' });
            return id as string;
        } catch (e) {
            toast.error('Failed to save discipline', { description: e instanceof Error ? e.message : undefined });
            throw e;
        } finally {
            setIsSavingDiscipline(false);
        }
    };

    const deleteDisciplineAsync = async (id: string) => {
        try {
            await removeDiscipline({ id: id as Id<"disciplines"> });
            toast.success('Discipline Deleted', { description: 'The discipline was deleted successfully.' });
        } catch (e) {
            toast.error('Failed to delete discipline', { description: e instanceof Error ? e.message : undefined });
        }
    };

    return (
        <NamingConventionsContext.Provider value={{
            isLoadingLocations: locationsData === undefined,
            locations: (locationsData ?? []) as Location[],
            isSavingLocation,
            saveLocationAsync,
            isDeletingLocation: false,
            deleteLocationAsync,

            isLoadingDisciplines: disciplinesData === undefined,
            disciplines: (disciplinesData ?? []) as Discipline[],
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
