import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { ProfileInput, ResetPasswordPayload } from "../data/schema";
import { Discipline, Location } from "../../naming-conventions/data/schema";

export const useProfileForm = () => {
    const locationsData = useQuery(api.locations.list);
    const locations = (locationsData ?? []) as Location[];
    const isLoadingLocations = locationsData === undefined;

    const disciplinesData = useQuery(api.disciplines.list);
    const disciplines = (disciplinesData ?? []) as Discipline[];
    const isLoadingDisciplines = disciplinesData === undefined;

    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [isSaving, setIsSaving] = useState(false);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [isResetPasswordPending] = useState(false);

    const updateProfileAsync = async (data: ProfileInput) => {
        setIsSaving(true);
        try {
            await updateProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phoneNumber,
                displayName: [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || undefined,
                locationId: data.locationId ? (data.locationId as Id<"locations">) : undefined,
                disciplineId: data.disciplineId ? (data.disciplineId as Id<"disciplines">) : undefined,
            });
            toast.success('Your profile has been updated.');
        } catch (e) {
            toast.error('Failed to update profile', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsSaving(false);
        }
    };

    const uploadAvatarAsync = async (formData: FormData) => {
        setIsSavingAvatar(true);
        try {
            const file = formData.get('file') as File | null;
            if (!file) throw new Error('No file provided');
            const url = await generateUploadUrl();
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            const { storageId } = await res.json();
            // Store the Convex-served URL for the uploaded avatar.
            const servedUrl = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/storage/${storageId}`;
            await updateProfile({ userImage: servedUrl });
            toast.success('Your avatar has been updated.');
            return { avatar: servedUrl };
        } catch (e) {
            toast.error('Failed to upload avatar', { description: e instanceof Error ? e.message : undefined });
            return { avatar: '' };
        } finally {
            setIsSavingAvatar(false);
        }
    };

    // Password reset is not used with magic-link auth.
    const resetPasswordAsync = async (_payload: ResetPasswordPayload): Promise<boolean> => {
        toast.default('Sign-in uses magic links — there is no password to reset.');
        return true;
    };

    return {
        isLoadingDisciplines,
        disciplines,

        isLoadingLocations,
        locations,

        isSavingAvatar,
        uploadAvatarAsync,

        isSaving,
        updateProfileAsync,

        isResetPasswordPending,
        resetPasswordAsync
    }
}
