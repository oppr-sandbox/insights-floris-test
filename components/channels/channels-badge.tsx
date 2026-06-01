import { Image, LucideIcon, Mic, Type } from "lucide-react";
import { TopicChannels } from "../pages/topics/data/schema";
import { cn } from "@/lib/utils";


type Channel = {
    value: 'Text' | 'Voice' | 'Image';
    icon: LucideIcon;
    class: string;
    iconClass: string;
}

const channels: Record<TopicChannels, Channel> = {
    TEXT: {
        value: "Text",
        icon: Type,
        class: "bg-primary/10 border-primary text-primary",
        iconClass: 'size-3 stroke-3'
    },
    VOICE: {
        value: "Voice",
        icon: Mic,
        class: "bg-success/10 border-success text-success-foreground",
        iconClass: 'size-3 stroke-2'
    },
    IMAGE: {
        value: "Image",
        icon: Image,
        class: "bg-warning/10 border-warning text-warning-foreground",
        iconClass: 'size-3 stroke-2',
    }

}

export function ChannelBadge({ channel, iconClassName, className, ...props }: { channel: TopicChannels, iconClassName?: string } & React.ComponentProps<"div">) {
    const channelData = channels[channel];
    return (<div
        className={cn(`flex items-center space-x-1 rounded-sm py-1 px-2 border font-semibold text-xs`, channelData.class, className)}
        {...props}
    >
        <channelData.icon className={cn("size-3 stroke-3", channelData.iconClass, iconClassName)} />
        <span>{channelData.value}</span>
    </div>);
}