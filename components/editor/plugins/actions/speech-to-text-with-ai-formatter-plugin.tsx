"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalCommand, LexicalNode } from "lexical"
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical"
import { LoaderCircle, MicIcon } from "lucide-react"

import { useReport } from "@/components/editor/editor-hooks/use-report"
import { CAN_USE_DOM } from "@/components/editor/shared/can-use-dom"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { $createHeadingNode } from "@lexical/rich-text"
import { $createListItemNode, $createListNode } from "@lexical/list"
import { Textarea } from "@/components/ui/textarea"
import { IconPlayerStopFilled } from "@tabler/icons-react"
import { useUserDetails } from "@/providers/UserContextProvider"

export const SPEECH_TO_TEXT_COMMAND: LexicalCommand<boolean> = createCommand(
  "SPEECH_TO_TEXT_COMMAND"
)

interface Node {
  children?: Node[];
  text: string;
  type: 'list' | 'heading' | 'text' | 'paragraph';
  listType?: 'bullet' | 'number';
  tag?: 'h1' | 'h2' | 'h3';
}

function buildNodesFromJson(jsonNodes: any[]): LexicalNode[] {
  return jsonNodes.map((node) => {
    switch (node.type) {
      case "text": {
        return $createTextNode(node.text ?? "");
      }

      case "paragraph": {
        const paragraph = $createParagraphNode();
        if (node.children) {
          paragraph.append(...buildNodesFromJson(node.children));
        }
        return paragraph;
      }

      case "heading": {
        const heading = $createHeadingNode(node.tag ?? "h1");
        if (node.children) {
          heading.append(...buildNodesFromJson(node.children));
        }
        return heading;
      }

      case "list": {
        const list = $createListNode(node.listType ?? "bullet");
        if (node.children) {
          list.append(...buildNodesFromJson(node.children));
        }
        return list;
      }

      case "listitem": {
        const listItem = $createListItemNode();
        if (node.children) {
          listItem.append(...buildNodesFromJson(node.children));
        }
        return listItem;
      }

      default: {
        // fallback: wrap text in paragraph if unknown type
        const fallback = $createParagraphNode();
        if (node.text) {
          fallback.append($createTextNode(node.text));
        }
        return fallback;
      }
    }
  });
}

export const SUPPORT_SPEECH_RECOGNITION: boolean =
  CAN_USE_DOM &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

function SpeechToTextWithAiFormatterPluginImpl() {

  const { tenant } = useUserDetails();
  const [editor] = useLexicalComposerContext()

  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [isSpeechToText, setIsSpeechToText] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [capturedText, setCapturedText] = useState<string | null>(null)
  const [isFormatting, setIsFormatting] = useState<boolean>(false);

  const SpeechRecognition =
    // @ts-expect-error missing type
    CAN_USE_DOM && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const recognition = useRef<typeof SpeechRecognition | null>(null)
  const report = useReport()

  useEffect(() => {

    if (isEnabled && recognition.current === null && SpeechRecognition) {
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = true

      recognition.current.addEventListener(
        "result",
        (event: typeof SpeechRecognition) => {
          const resultItem = event.results.item(event.resultIndex)
          const { transcript } = resultItem.item(0)
          report(transcript)

          const transcribed = transcript.trim()
          if (transcribed) {
            setCapturedText(transcribed)

            if (resultItem.isFinal) {
              setShowConfirm(true);
              if (isSpeechToText) {
                editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText)
                setIsSpeechToText(!isSpeechToText)
              }
            }
          }
        })
    }

    if (recognition.current) {
      if (isEnabled) {
        recognition.current.start()
      } else {
        recognition.current.stop()
      }
    }

    return () => {
      if (recognition.current !== null) {
        recognition.current.stop()
      }
    }
  }, [SpeechRecognition, editor, isEnabled, report])

  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (_isEnabled: boolean) => {
        setIsEnabled(_isEnabled)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  // --- handle insertions ---
  const insertText = (text: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(text)
      }
    })
  }

  const insertNode = (nodes: any[]) => {
    editor.update(() => {
      const lexicalNodes = buildNodesFromJson(nodes);
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $insertNodes(lexicalNodes);
      };
    });
  };

  const handleInsertRaw = () => {
    if (capturedText) {
      insertText(capturedText);
    }
    setCapturedText(null);
    setShowConfirm(false);
  };

  const handleFormatWithAI = async () => {
    if (!capturedText) return;
    try {
      setIsFormatting(true);

      const res = await fetch("/api/formatText", {
        method: "POST",
        headers: { 
            'X-Tenant': tenant,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ transcribed: capturedText }),
      });
      const rawResoponse: Node[] = await res.json();
      insertNode(rawResoponse);

    } catch (err) {
      console.error("Formatting failed:", err);
      insertText(capturedText); // fallback to raw
    }
    setCapturedText(null);
    setIsFormatting(false);
    setShowConfirm(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* TODO add confirmation modal when ending the speech to text if the user wants to send it to an ai to format it */}
          <Button
            onClick={() => {
              editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText)
              setIsSpeechToText(!isSpeechToText)
            }}
            variant={isSpeechToText ? "outline" : "ghost"}
            title="Speech To Text"
            aria-label={`${isSpeechToText ? "Enable" : "Disable"} speech to text`}
            className="p-2"
            size={"sm"}
          >
            {!isSpeechToText ?
              <MicIcon className="size-4" />
              :
              <IconPlayerStopFilled className="size-4 text-destructive" />
            }
          </Button>
        </TooltipTrigger>
        <TooltipContent>Speech To Text</TooltipContent>
      </Tooltip>
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="sm:max-w-5xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Format your text?</AlertDialogTitle>
            <Textarea
              value={capturedText ?? ''}
              onChange={(e) => {
                setCapturedText(e.target.value)
              }}
              className="resize-none h-80 lg:text-lg" />
            <AlertDialogDescription>
              Do you want to format the captured text with AI, or insert it as-is?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={handleInsertRaw} disabled={isFormatting}>
              Insert Raw
            </Button>
            <Button onClick={handleFormatWithAI} disabled={isFormatting}>
              {isFormatting ?
                <>
                  <LoaderCircle className="animate-spin text-gray-700 size-5" /> Formatting with AI
                </>
                :
                <>Format with AI</>
              }
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const SpeechToTextWithAiFormatterPlugin = SUPPORT_SPEECH_RECOGNITION
  ? SpeechToTextWithAiFormatterPluginImpl
  : () => null
