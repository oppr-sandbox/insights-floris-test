'use client'

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { FieldAutoSave } from "./edit-mode";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { TopicStatus } from "../../data/schema";
import { useEffect } from "react";

export default function BasicInfo() {

    const { updateFormField, saveField, data } = useTopicDetail();
    const { control, subscribe } = useFormContext();

    useEffect(() => {
        // make sure to unsubscribe;    
        return subscribe({
            formState: {
                values: true,
            },
            callback: ({ values }) => {
                const basicInfoFields = {
                    name: values['name'],
                    description: values['description']
                }
                updateFormField(basicInfoFields);
            },
        });
    }, [subscribe])

    const isAutoSave = data!.status === TopicStatus.Draft;

    return (
        <TabsContent value="basic-info">
            <div className="flex flex-col pt-4 pb-6">
                <h4 className="font-semibold">Basic Information</h4>
                <p className="text-muted-foreground">Provide the essential details for your topic</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="code">Topic Code</Label>
                    <Input disabled id="code" name="code" defaultValue={data!.topicCode + " (Auto-generated)"} />
                </div>

                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="name"><span>Title <span className="text-destructive">*</span></span></Label>
                            <FormControl>
                                <FieldAutoSave name="name" enable={isAutoSave} onSave={saveField}>
                                    <Input
                                        placeholder="Enter topic title"
                                        {...field}
                                    />
                                </FieldAutoSave>
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="description"><span>Description <span className="text-destructive">*</span></span></Label>
                            <FormControl>
                                <FieldAutoSave name="description" enable={isAutoSave} onSave={saveField}>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        rows={6}
                                        placeholder="Brief description of what this topic is about"></Textarea>
                                </FieldAutoSave>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <Alert variant="info" className="mt-4">
                <AlertDescription className="text-primary">
                    <span>
                        <span className="font-bold">Tip:</span> A clear title and description help participants understand what feedback you&apos;re looking for.
                    </span>
                </AlertDescription>
            </Alert>
        </TabsContent>
    )
}