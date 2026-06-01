import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Image, Mic, Type } from "lucide-react";
import { TopicChannels, TopicStatus } from "../../data/schema";
import { SaveFieldType, useTopicDetail } from "../hooks/useTopicDetail";
import { debounce } from "@/utils/helpers/helpers";
import { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconBulb } from "@tabler/icons-react";

export default function Channels() {
    const { updateFormField, saveField, data } = useTopicDetail();
    const isAutoSave = data!.status === TopicStatus.Draft;
    const [localChannels, setLocalChannels] = useState<TopicChannels[]>(data?.channels ?? []);

    const channelOptions = useMemo(() => [
        { id: 'text', label: 'Text', icon: <Type className="size-4" />, enum: TopicChannels.Text, description: 'Written feedback and comments' },
        { id: 'voice', label: 'Voice', icon: <Mic className="size-4" />, enum: TopicChannels.Voice, description: 'Audio recordings and voice notes' },
        { id: 'image', label: 'Image', icon: <Image className="size-4" />, enum: TopicChannels.Image, description: 'Screenshots, photos, and visual feedback' },
    ], []);

    const toggleChannel = (channel: TopicChannels, checked: boolean) => {
        setLocalChannels(prev => {
            const updated = checked
                ? Array.from(new Set([...prev, channel]))
                : prev.filter(c => c !== channel);

            // defer to next tick so it doesn’t run during render
            setTimeout(() => autoSaveChannel(updated), 0);
            return updated;
        });
    };

    const debouncedSave = useMemo(
        () =>
            debounce((val: SaveFieldType) => {
                saveField(val);
            }, 500),
        [saveField]
    );

    const autoSaveChannel = useCallback(
        (value: TopicChannels[]) => {
            const field: SaveFieldType = {
                name: "channels",
                value: value,
            };
            if (isAutoSave) {
                debouncedSave(field);
            } else {
                updateFormField(field)
            }
        },
        [debouncedSave, isAutoSave, updateFormField]
    );

    return (
        <TabsContent value="channels">
            <div className="flex flex-col space-y-4 mt-4">
                <div>
                    <h4 className="font-semibold">Feedback Channels</h4>
                    <p className="text-muted-foreground">Choose how participants can provide feedback</p>
                </div>

                <Label>Allowed Input Types *</Label>
                <div className="flex flex-col space-y-2">
                    {channelOptions.map(({ id, label, icon, enum: channelEnum, description }) => {
                        return (
                            <Label
                                key={id}
                                className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary/60 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-primary/90 dark:has-[[aria-checked=true]]:bg-blue-950">
                                <Checkbox
                                    id={id}
                                    value={channelEnum}
                                    checked={localChannels.includes(channelEnum)}
                                    onCheckedChange={(state) => {
                                        toggleChannel(channelEnum, state as boolean);
                                    }}
                                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/70"
                                />
                                <div className="grid gap-1.5 font-normal">
                                    <div className="flex space-x-2 items-center">
                                        {icon}
                                        <p className="text-sm leading-none font-medium">
                                            {label}
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {description}
                                    </p>
                                </div>
                            </Label>
                        );
                    })}
                </div>

                <Alert variant="info">
                    <AlertTitle>
                        <div className="flex flex-row items-center space-x-1">
                            <IconBulb className="size-6" />
                            <h5>Channel Tips:</h5>
                        </div>
                    </AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc text-primary ps-6">
                            <li>Text: Best for detailed feedback and specific suggestions</li>
                            <li>Voice: Great for capturing tone and emotion</li>
                            <li>Image: Perfect for visual feedback and demonstrations</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </div>
        </TabsContent>
    )
}