"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileMessage,
  DropzoneMessage,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { TabsContent } from "@/components/ui/tabs";
import { CloudCheck, Download, FileText, LoaderCircle, RotateCcwIcon, UploadIcon, Lightbulb } from "lucide-react";
import { TopicAttachmentForm } from "../../data/schema";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { KnowledgeStatus } from "@/components/attachments/knowledge-status";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

type AttachmentFile = {
  id: string;
  url: string;
  file?: File;
  fileName: string;
  fileType: string;
  status: 'pending' | 'success' | 'error';
  uploaded: boolean;
  newlyUploaded: boolean;

}

async function urlToBlob(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error converting URL to Blob:", error);
    return null;
  }
}

export default function Attachments() {
  const { data, isLoading, uploadAttachments } = useTopicDetail();
  const reparse = useMutation(api.ingestion.reparse);
  const isFirstLoad = useRef(true);

  // Live ingestion status keyed by filename — the dropzone keeps its own local
  // file list, so we look the parse state up from the reactive topic data.
  const ingestByName = new Map(
    (data?.topicAttachments ?? []).map((a) => [a.fileName, { id: a.id, status: a.parseStatus }]),
  );

  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const uploadedSet = useRef<Set<string>>(new Set());
  const duplicateFileDropped = useRef<Set<string>>(new Set());
  const notifTimerId = useRef<NodeJS.Timeout | undefined>(undefined);

  const filesToUpload = useRef<TopicAttachmentForm[]>([]);
  const uploadTimerId = useRef<NodeJS.Timeout | null>(null);

  const dropzone = useDropzone({
    onDropFile: async (file: File) => {

      const attachmentFile: TopicAttachmentForm = {
        id: crypto.randomUUID(),
        file
      }
      const fileHash = `${file.name}-${file.type}-${file.size}`;

      if (uploadedSet.current.has(fileHash)) {
        if (!duplicateFileDropped.current.has(file.name))
          duplicateFileDropped.current.add(file.name);
        return { status: "success" as const, result: undefined };
      }
      filesToUpload.current.push(attachmentFile);

      uploadedSet.current.add(fileHash);
      const dropzoneFile: AttachmentFile = {
        id: attachmentFile.id,
        url: URL.createObjectURL(file),
        file: attachmentFile.file,
        fileName: attachmentFile.file.name,
        fileType: attachmentFile.file.type,
        status: 'pending',
        uploaded: false,
        newlyUploaded: false,
      }
      setFiles((prev) => [...prev, dropzoneFile]);
      uploadFiles();

      return { status: "success" as const, result: dropzoneFile.url };
    },
    validation: {
      maxFiles: 10,
      maxSize: 10 * 1024 * 1024,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png"],
        "application/pdf": [".pdf"],
        "application/msword": [".doc", ".docx"],
        "text/plain": [".txt"],
      }
    },
  });

  const uploadFiles = useCallback(() => {
    if (filesToUpload.current.length === 0) return;
    if (uploadTimerId.current) {
      clearTimeout(uploadTimerId.current);
    }

    uploadTimerId.current = setTimeout(async () => {

      const success = await uploadAttachments(filesToUpload.current);
      const uploadedIds = new Set(filesToUpload.current.map((f) => f.id));

      setFiles((prev) =>
        prev.map((f) =>
          uploadedIds.has(f.id)
            ? {
              ...f,
              status: success ? "success" : "error",
              uploaded: true,
              newlyUploaded: success,
            }
            : f
        )
      );

      if (success) {
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              uploadedIds.has(f.id)
                ? { ...f, newlyUploaded: false }
                : f
            )
          );
        }, 5000);
      }

      filesToUpload.current = [];
    }, 100);
  }, [filesToUpload, uploadAttachments]);

  const retryUpload = async (retryFile: AttachmentFile) => {
    const attchmentFile: TopicAttachmentForm = {
      id: retryFile.id,
      file: retryFile.file!
    };

    setFiles((prev) =>
      prev.map((file) =>
        file.id === retryFile.id
          ? {
            ...file,
            status: 'pending'
          }
          : file
      )
    );

    const uploadSucceeded = await uploadAttachments([attchmentFile]);

    setFiles((prev) =>
      prev.map((file) =>
        file.id === retryFile.id
          ? {
            ...file,
            newlyUploaded: uploadSucceeded,
            status: uploadSucceeded ? "success" : "error"
          }
          : file
      )
    );

    if (uploadSucceeded) {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === retryFile.id ? { ...f, newlyUploaded: false } : f
          )
        );
      }, 5_000);
    }
  };

  useEffect(() => {
    if (isFirstLoad.current && !isLoading && data?.topicAttachments) {
      isFirstLoad.current = false;

      // Prepopulate uploadedSet for validation
      const mappedFiles: AttachmentFile[] = data.topicAttachments.map((file) => {
        uploadedSet.current.add(
          `${file.fileName}-${file.contentType}-${file.fileSize ?? 0}`
        );

        return {
          id: file.id,
          url: file.url, // raw URL for now
          fileName: file.fileName,
          fileType: file.contentType,
          file: undefined, // will be hydrated later
          status: "success",
          uploaded: true,
          newlyUploaded: false,
        };
      });

      setFiles(mappedFiles);

      // Hydrate with blobs in background (per file)
      data.topicAttachments.forEach(async (file) => {
        const blob = await urlToBlob(file.url);
        if (blob) {
          const updated: AttachmentFile = {
            id: file.id,
            url: file.url,
            fileName: file.fileName,
            fileType: file.contentType,
            file: new File([blob], file.fileName, { type: file.contentType }),
            status: "success",
            uploaded: true,
            newlyUploaded: false,
          };

          setFiles((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          );
        }
      });
    }
  }, [isFirstLoad, data, isLoading]);


  useEffect(() => {
    if (duplicateFileDropped.current.size > 0) {
      if (!notifTimerId.current)
        clearTimeout(notifTimerId.current);

      notifTimerId.current = setTimeout(() => {
        toast.warning('Duplicate file upload prevented', {
          description: <ul className='ml-4 list-disc'>
            {[...duplicateFileDropped.current].map((fileName, i) => (
              <li key={i} className='text-xs'>
                {fileName}
              </li>
            ))}
          </ul>
        });
        duplicateFileDropped.current.clear();
      }, 100);
    }
  }, [duplicateFileDropped.current.size])

  const downloadAttachment = (file: AttachmentFile) => {
    const link = document.createElement("a");
    link.href = file.url; // already blob/object URL or server URL
    link.download = file.fileName; // suggest filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TabsContent value="attachments">
      <div className="flex flex-col mt-4">
        <div>
          <h4 className="font-semibold">Attachments</h4>
          <p className="text-muted-foreground">
            Add files to provide context or reference materials
          </p>
        </div>
        <Dropzone {...dropzone}>
          <div className="mb-4">
            <div className="flex justify-end">
              <DropzoneMessage />
            </div>
            <DropZoneArea>
              <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UploadIcon size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">
                      Click or drag files here
                    </p>
                    <p className="text-muted-foreground text-xs text-wrap">
                      Supported: Images (JPEG, JPG, PNG), Documents (PDF, DOC, DOCX,
                      TXT) - Max 10MB each
                    </p>
                  </div>
                </div>
              </DropzoneTrigger>
            </DropZoneArea>
          </div>

          <DropzoneFileList className="grid grid-cols-3 gap-3 mb-4">
            {files.map((file) => (
              <div key={file.id} className="flex space-x-2 items-center rounded-md bg-muted/40 p-2">
                {file.fileType.startsWith("image/") ?
                  (
                    <div className="relative min-w-12 w-12 min-h-12 h-12 border border-secondary rounded-lg overflow-hidden">
                      <Image
                        src={file.url}
                        alt={file.fileName}
                        fill
                        sizes="40px"
                        className="object-contain"
                        quality={50}
                      />
                    </div>
                  )
                  :
                  (<FileText className="w-12 h-12 text-destructive" />)
                }
                <div className="flex flex-col flex-1 min-w-0"
                  key={file.id}>
                  <div className="flex justify-between items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-semibold line-clamp-1 truncate">
                          {file.fileName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {file.fileName}
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center space-x-2">
                      {(file.newlyUploaded) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CloudCheck className="size-5 text-success-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">New Upload</span>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {file.status === 'pending' && !file.uploaded && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <LoaderCircle className="animate-spin text-gray-500 size-5" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">Uploading File</span>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {file.status === 'success' && file.uploaded && (
                        <Button
                          onClick={() => { downloadAttachment(file) }}
                          variant="ghost"
                          size="icon"
                          className="size-8">
                          <Download />
                        </Button>

                      )}
                      {file.status === "error" && !file.uploaded && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => { retryUpload(file) }}>
                          <RotateCcwIcon />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <p>{((file.file?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB</p>
                    <DropzoneFileMessage />
                  </div>
                  {(() => {
                    const meta = ingestByName.get(file.fileName);
                    if (!meta?.status) return null;
                    return (
                      <div className="mt-1">
                        <KnowledgeStatus
                          status={meta.status}
                          onRetry={() => reparse({ fileId: meta.id as Id<"files"> })}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </DropzoneFileList>
        </Dropzone>
        <Alert variant="info">
          <AlertTitle>
            <div className="flex flex-row items-center space-x-1">
              <Lightbulb className="size-6" />
              <h5>Attachment Tips:</h5>
            </div>
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc text-primary ps-6">
              <li>Include reference documents or examples</li>
              <li>Add screenshots to show current state</li>
              <li>Provide specification documents for technical feedback</li>
              <li>Keep file sizes reasonable for easy access</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </TabsContent>
  );
}
