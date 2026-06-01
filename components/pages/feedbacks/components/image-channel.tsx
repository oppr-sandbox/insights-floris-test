import { Card, CardContent } from "@/components/ui/card";
import { CaptureDropzoneTrigger, Dropzone, DropZoneArea, DropzoneFileList, DropzoneMessage, DropzoneRemoveFile, DropzoneTrigger, useDropzone } from "@/components/ui/dropzone";
import { Camera, CameraIcon, CloudUploadIcon, Image, Trash2Icon } from "lucide-react";
import { useFeedbackForm } from "../hooks/useFeedbackForm";
import { uniqueId } from "lodash";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Img from "next/image";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageCarouselModal } from "@/components/attachments/attachment-preview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ImageChannel() {

    const {
        isActive,
        formData,
        handleChange,
    } = useFeedbackForm()

    const cameraRef = useRef<HTMLLabelElement>(null);
    const [imagePreview, setImagePreview] = useState<{ open: boolean, idx: number }>({ open: false, idx: 0 });
    const isMobile = useIsMobile();

    const {
        images,
        deletedImages,
    } = formData

    const dropzone = useDropzone({
        onDropFile: async (file: File) => {

            const fileUrl = URL.createObjectURL(file);

            handleChange('images', [...images, {
                id: uniqueId(),
                url: fileUrl,
                file: file,
                fileName: file.name,
                isNew: true
            }
            ])

            return {
                status: "success",
                result: fileUrl,
            };
        },
        validation: {
            accept: {
                "image/*": [],
            },
            maxSize: 10 * 1024 * 1024,
            maxFiles: 10,
        },
    });

    const handleRemoveFile = (id: string, isNew: boolean) => {
        handleChange('images', [...images.filter(p => p.id !== id)])

        if (!isNew)
            handleChange('deletedImages', [...deletedImages, id])
    }

    return (
        <Card className="mb-2">
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
                            <Camera />
                        </div>
                        <h3 className="font-semibold leading-none tracking-tight text-h3">
                            Image Attachments
                        </h3>
                    </div>
                </div>
                <div>
                    {
                        isMobile && (
                            <Button size="sm" onClick={() => cameraRef?.current?.click()} className="mt-4">
                                <CameraIcon />
                                Take a photo
                            </Button>
                        )
                    }
                    <Dropzone {...dropzone}>
                        {
                            isActive && (
                                <div>
                                    <div className="flex justify-between">
                                        <DropzoneMessage />
                                    </div>
                                    <DropZoneArea className="flex flex-col">
                                        <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent text-center text-sm">
                                            <CloudUploadIcon className="size-8" />
                                            <div>
                                                <p className="font-semibold">
                                                    Upload listing images
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Click here or drag and drop to upload
                                                </p>
                                            </div>
                                        </DropzoneTrigger>
                                        <CaptureDropzoneTrigger ref={cameraRef} className="hidden" />
                                    </DropZoneArea>
                                </div>
                            )
                        }

                        {images.length > 0 && (
                            <div className="mt-4">
                                <DropzoneFileList className="grid grid-cols-1 md:grid-cols-4 gap-3 p-0">
                                    {images.map((image, idx) => (
                                        <div
                                            className="overflow-hidden rounded-md p-0 shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer"
                                            key={image.id}
                                            onClick={() => {
                                                setImagePreview({
                                                    open: true,
                                                    idx
                                                })
                                            }}
                                        >
                                            <Img
                                                src={image.url}
                                                alt={`uploaded-${image.fileName}`}
                                                width={1920}
                                                height={1080}
                                                className="aspect-video object-cover"
                                            />
                                            <div className="flex items-center justify-between p-2 pl-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm">
                                                        {image.fileName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {image.file ? (image.file.size / (1024 * 1024)).toFixed(
                                                            2
                                                        ) : '...'}{" "}
                                                        MB
                                                    </p>
                                                </div>
                                                {
                                                    isActive && (
                                                        <DropzoneRemoveFile
                                                            variant="ghost"
                                                            className="shrink-0 hover:outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFile(image.id, image.isNew)
                                                            }}>
                                                            <Trash2Icon className="size-4" />
                                                        </DropzoneRemoveFile>
                                                    )
                                                }
                                            </div>


                                        </div>
                                    ))}
                                </DropzoneFileList>
                                <Dialog open={imagePreview.open} onOpenChange={(value) => {
                                    setImagePreview(prev => ({ ...prev, open: value }));
                                }}>
                                    <DialogTrigger asChild>
                                    </DialogTrigger>
                                    <DialogContent className="md:w-fit">
                                        <DialogHeader>
                                            <DialogTitle></DialogTitle>
                                            <DialogDescription></DialogDescription>
                                        </DialogHeader>

                                        <ImageCarouselModal images={images} jumpTo={imagePreview.idx} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                        {
                            !isActive && images.length == 0 && (
                                <EmptyState
                                    title="No Uploaded Image"
                                    description="This feedback has no uploaded images."
                                    className="p-4 mt-4"
                                    icons={[Image]}
                                />
                            )
                        }
                    </Dropzone>
                </div>
            </CardContent>
        </Card >
    )
}