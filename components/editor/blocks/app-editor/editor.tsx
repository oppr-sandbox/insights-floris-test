"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"
import { cn } from "@/lib/utils"
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

type Props = {
  placeholder?: string;
  maxLength?: number;
  className?: string;
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  editorMarkdownState?: string;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
}

export function Editor({
  className,
  placeholder,
  maxLength,
  editorState,
  editorSerializedState,
  editorMarkdownState,
  onChange,
  onSerializedChange,
}: Props) {
  return (
    <div className={cn("bg-background overflow-hidden rounded-lg border shadow", className)}>
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
          ...(editorMarkdownState ? { editorState: () => $convertFromMarkdownString(editorMarkdownState, TRANSFORMERS) } : {})
        }}
      >
        <TooltipProvider>
          <Plugins
            placeholder={placeholder}
            maxLength={maxLength}
          />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
