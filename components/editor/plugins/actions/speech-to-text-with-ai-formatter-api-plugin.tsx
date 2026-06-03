"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalCommand, LexicalNode } from "lexical"
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  createCommand,
} from "lexical"
import { LoaderCircle, MicIcon, Square, Wand2 } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/sonner"
import { convertWebMToWavBlob } from "@/utils/helpers/helpers"
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

function SpeechToTextWithAiFormatterApiPluginImpl() {
  
  const { tenant } = useUserDetails();
  const [editor] = useLexicalComposerContext()

  const [isSpeechToText, setIsSpeechToText] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [capturedText, setCapturedText] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

    recorder.onstop = async () => {
      setIsTranscribing(true);

      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const wavBlob = await convertWebMToWavBlob(blob);
      // Prepare FormData and send WAV to API
      const formData = new FormData();
      
      formData.append('audio', wavBlob, 'recording.wav');
      let transcribed: string = '';

      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
          headers: { 
              'X-Tenant': tenant
          },
        });

        const data = await res.json();
        transcribed = data.transcript.trim();
      } catch {
        toast.error('Failed to transcribe audio.');
        transcribed = 'Failed to transcribe audio.';
      }
      
      setIsTranscribing(false);
      setCapturedText(transcribed)
      setShowConfirm(true);

    };

    recorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

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
      } else {
        $insertNodes([$createParagraphNode()]);
        $insertNodes(lexicalNodes);
      }
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
      toast.error('Failed to format text with ai. Inserting without format...');
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
              if (isSpeechToText) {
                stopRecording();
              } else {
                startRecording();
              }
              setIsSpeechToText(!isSpeechToText)
            }}
            variant={isSpeechToText ? "outline" : "ghost"}
            title="Speech To Text"
            aria-label={`${isSpeechToText ? "Enable" : "Disable"} speech to text`}
            className="p-2"
            size={"sm"}
            disabled={isTranscribing}
          >
            {!isTranscribing ?
              !isSpeechToText ?
                <MicIcon className="size-4" />
                :
                <Square className="size-4 text-destructive animate-pulse duration-50 fill-current" />
              :
              <div className="flex items-center space-x-2">
                <Spinner variant="circle" />
                <span>Transcribing...</span>
              </div>
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
              <Wand2 className="size-4" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const SpeechToTextWithAiFormatterApiPlugin = SUPPORT_SPEECH_RECOGNITION
  ? SpeechToTextWithAiFormatterApiPluginImpl
  : () => null
