import { Editor } from "@/components/editor/blocks/app-editor/editor";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs";
import { Lightbulb } from "lucide-react";
import { SerializedEditorState } from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { debounce } from "@/utils/helpers/helpers";
import { TopicStatus } from "../../data/schema";

const placeholder = `
Provide detailed instructions, context, or questions for participants...

Example:

**What we're looking for:**
- Your honest feedback on the new feature
- Specific pain points or challenges you encountered
- Suggestions for improvement

**Please include:**
1. Your role/department
2. How often you would use this feature
3. Any additional comments
`

export default function Content() {
    const { updateFormField, saveField, data } = useTopicDetail();
    const isAutoSave = data!.status === TopicStatus.Draft;

    const [editorState, setEditorState] = useState<SerializedEditorState | undefined>(undefined);

    const debouncedSave = useMemo(
        () =>
            debounce((val: SerializedEditorState) => {
                saveField({
                    name: "content",
                    value: JSON.stringify(val),
                });
            }, 500),
        [saveField]
    );

    const autoSaveContent = useCallback(
        (value: SerializedEditorState) => {
            if (isAutoSave) {
                debouncedSave(value);
            } else {
                updateFormField({
                    name: "content",
                    value: JSON.stringify(value),
                })
            }
        },
        [debouncedSave, isAutoSave, updateFormField]
    );

    useEffect(() => {
        if (data) {
            if (typeof data.content === "string" && data.content.trim() !== "") {
                setEditorState(JSON.parse(data.content) as SerializedEditorState);
                return;
            }
            setEditorState(data.content as SerializedEditorState | undefined);
        }
    }, [data]);

    return (

        <TabsContent value="content">
            <div className="flex flex-col pt-4 pb-6">
                <h4 className="font-semibold">Content & Instructions</h4>
                <p className="text-muted-foreground">Provide detailed context and instructions for participants</p>
            </div>
            <div className="grid gap-3">
                <Editor
                    editorSerializedState={editorState}
                    onSerializedChange={(val) => autoSaveContent(val)}
                    maxLength={2000}
                    placeholder={placeholder}
                />
            </div>
            <Alert variant="info" className="mt-4">
                <AlertTitle>
                    <div className="flex flex-row items-center space-x-1">
                        <Lightbulb className="size-6" />
                        <h5>Content Tips:</h5>
                    </div>
                </AlertTitle>
                <AlertDescription>
                    <ul className="list-disc text-primary ps-6">
                        <li>Be specific about what feedback you need</li>
                        <li>Provide context about why this topic matters</li>
                        <li>Include any relevant background information</li>
                        <li>Ask clear, actionable questions</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </TabsContent>
    )
}