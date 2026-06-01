import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Image,
  LucideIcon,
  Mic,
  Type,
} from "lucide-react"
import { TopicChannels, TopicStatus } from "./schema";

type Status = {
  value: string;
  color: 'default' | 'secondary' | 'success' | 'tertiary' | 'warning'
}

type Channel = {
  value: 'Text' | 'Voice' | 'Image';
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning'
}

export const statuses: Record<TopicStatus, Status> = {
  [TopicStatus.Draft]: {
    value: "Draft",
    color: "warning"
  },
  [TopicStatus.Published]: {
    value: "Published",
    color: "secondary",
  },
  [TopicStatus.Active]: {
    value: "Active",
    color: "success",
  },
  [TopicStatus.Paused]: {
    value: "Paused",
    color: "default"
  },
  [TopicStatus.Completed]: {
    value: "Completed",
    color: "tertiary"
  },
};

export const channels: Record<TopicChannels, Channel> = {
  TEXT: {
    value: "Text",
    icon: Type,
    color: 'primary'
  },
  VOICE: {
    value: "Voice",
    icon: Mic,
    color: 'success'
  },
  IMAGE: {
    value: "Image",
    icon: Image,
    color: 'warning'
  }
}

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDown,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRight,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUp,
  },
]