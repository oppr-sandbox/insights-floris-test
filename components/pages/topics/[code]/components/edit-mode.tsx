'use client'
import { cloneElement, ReactElement, useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attachments from "./edit-attachments";
import BasicInfo from "./edit-basic-info";
import Channels from "./edit-channels";
import Scheduling from "./edit-scheduling";
import UserAccess from "./edit-user-access";
import { debounce } from "@/utils/helpers/helpers";
import Content from "./edit-content";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { TopicChannels } from "../../data/schema";

type Field = {
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

interface FieldAutoSaveProps {
  name: string;
  enable: boolean;
  onSave: (field: Field) => void;
  children: ReactElement; // single input element
}

export const FieldAutoSave: React.FC<FieldAutoSaveProps> = ({ name, enable, onSave, children }) => {
  const { control, getValues, register } = useFormContext();
  const value = useWatch({ control, name });
  const prevValueRef = useRef(getValues(name));

  // Wrap the passed onSave with debounce
  const debouncedSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debounce((value: any) => onSave({ name, value }), 500),
    [name, onSave]
  );

  useEffect(() => {
    if (!enable || value === prevValueRef.current) return;

    prevValueRef.current = value;
    debouncedSave(value);

    return () => {
      debouncedSave.cancel?.();
    };
  }, [value, debouncedSave, enable]);

  // Inject register props into the child input
  const childWithRegister = cloneElement(children, {
    ...register(name),
  });

  return childWithRegister;
};

export function EditMode({ className }: { className?: string | undefined }) {
  const { data } = useTopicDetail();
  const form = useForm({
    defaultValues: {
      ...data,
      channels: data?.channels?.length
        ? data.channels
        : [TopicChannels.Text, TopicChannels.Voice, TopicChannels.Image], // default all channels checked
    },
  });

  return (
    <FormProvider {...form}>
      <Tabs defaultValue="basic-info">
        <div className="sticky top-28 bg-background z-50 py-2 px-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
            <TabsTrigger value="basic-info">
              Basic Info <span className="text-destructive">*</span>
            </TabsTrigger>
            <TabsTrigger value="content">
              Content
            </TabsTrigger>
            <TabsTrigger value="scheduling">
              Scheduling <span className="text-destructive">*</span>
            </TabsTrigger>
            <TabsTrigger value="channels">
              Channels <span className="text-destructive">*</span>
            </TabsTrigger>
            <TabsTrigger value="user-access">
              User Access <span className="text-destructive">*</span>
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="px-4">
          <BasicInfo />
          <Content />
          <Scheduling />
          <Channels />
          <UserAccess />
          <Attachments />
        </div>
      </Tabs>
    </FormProvider>
  )
}
