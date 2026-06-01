import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { TopicCreation, topicCreationSchema } from "../data/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useUserDetails } from "@/providers/UserContextProvider";
import { useEffect, useState } from "react";
import LocationCombobox from "../../settings/naming-conventions/components/location-combobox";
import DisciplineCombobox from "../../settings/naming-conventions/components/discipline-combobox";
import { NamingConventionsProvider } from "../../settings/naming-conventions/hooks/useNamingConventions";
import posthog from "posthog-js";

type CreateTopicResponse = {
    id: string;
    topicCode: string;
}

export interface SelectItem {
    id: string;
    name: string;
}

export default function CreateTopicModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user, tenant } = useUserDetails();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const createTopic = useMutation(api.topics.create);
    const form = useForm<TopicCreation>({
        resolver: zodResolver(topicCreationSchema),
        defaultValues: {
            name: 'Untitled Topic',
            disciplineId: user.disciplineId,
            locationId: user.locationId
        },
        mode: "onChange"
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset({
                name: 'Untitled Topic',
                disciplineId: user.disciplineId,
                locationId: user.locationId
            });
        }
        onOpenChange(open);

    }

    const handleSubmit = async () => {
        const formValues = form.getValues();
        const payload = topicCreationSchema.parse(formValues);

        setIsPending(true);
        try {
            const res = await createTopic({
                name: payload.name,
                locationId: payload.locationId as Id<"locations">,
                disciplineId: payload.disciplineId as Id<"disciplines">,
            });
            posthog.capture('topic_created', {
                topic_code: res.topicCode,
                topic_id: res.id,
                name: payload.name,
                discipline_id: payload.disciplineId,
                location_id: payload.locationId,
            });
            toast.success(`Topic ${res.topicCode} has been created.`);
            setIsRedirecting(true);
            router.push(`/${tenant}/topics/${res.topicCode}`);
        } catch (e) {
            toast.error('Failed to create topic', {
                description: e instanceof Error ? e.message : 'Please fill all required fields',
            });
        } finally {
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (user) {
            form.setValue('locationId', user.locationId ?? '');
            form.setValue('disciplineId', user.disciplineId ?? '');
        }
    }, [user, form]);

    return (
        <NamingConventionsProvider>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <Form {...form}>
                    <DialogContent className="sm:max-w-[30rem]">
                        <DialogHeader>
                            <DialogTitle>Create a Topic</DialogTitle>
                            <DialogDescription>
                                Enter the required information to create a topic.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="firstName">Topic Name<span className="text-destructive">*</span></Label>
                                                <FormMessages className="mt-0 text-xs" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} autoComplete="off" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="locationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="locationId">Location<span className="text-destructive">*</span></Label>
                                                <FormMessages className="mt-0 text-xs" />
                                            </div>
                                            <FormControl>
                                                <LocationCombobox value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="disciplineId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="disciplineId">Discipline<span className="text-destructive">*</span></Label>
                                                <FormMessages className="mt-0 text-xs" />
                                            </div>
                                            <FormControl>
                                                <DisciplineCombobox value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                                type="button"
                                disabled={isPending || !form.formState.isValid || isRedirecting}
                                onClick={handleSubmit}
                            >
                                {isPending
                                    ? 'Creating...'
                                    : isRedirecting
                                        ? 'Redirecting...'
                                        : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Form>
            </Dialog>
        </NamingConventionsProvider>
    )
}