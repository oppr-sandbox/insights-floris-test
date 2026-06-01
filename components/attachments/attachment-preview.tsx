import { Download, FileText } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel"
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export interface AttachmentData {
    id: string;
    url: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    contentType: string;
    contentHash: string;
    createdAt: string;
    createdBy: string;
}
export function ImageCarouselModal({ images, jumpTo }: { images: { url: string }[], jumpTo?: number }) {

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }
        setCount(images.length);
        setCurrent(api.selectedScrollSnap());
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });

    }, [api, images.length, jumpTo]);

    useEffect(() => {
        if (api && jumpTo && jumpTo >= 0 && jumpTo < images.length) {
            api.scrollTo(jumpTo);
        }
    }, [api, images.length, jumpTo]);

    const downloadCurrentImage = () => {
        const currentImage = images[current];
        const link = document.createElement("a");

        const url = new URL(currentImage.url);
        let filename = url.pathname.substring(url.pathname.lastIndexOf("/") + 1);
        filename = decodeURIComponent(filename);

        link.href = currentImage.url;
        link.download = filename || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <Carousel setApi={setApi} opts={{ loop: true }} className="w-fit max-w-[80vw]">
                <CarouselContent parentClassName="px-1 pb-2 pt-1" className="flex items-center -ml-4">
                    {images.map((img, index) => (
                        <CarouselItem
                            key={index}
                            className="flex justify-center items-center"
                        >
                            <Card className="py-0 bg-muted/50">
                                <CardContent className="p-4">
                                    <Image
                                        src={img.url}
                                        alt="image"
                                        width={1920}
                                        height={1080}
                                        className="!w-[100%] min-w-12 min-h-12 max-h-[75vh] object-contain"
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <Button onClick={downloadCurrentImage} size="icon" variant="ghost" className="absolute top-[calc(100%+0.5rem)] translate-y-0 left-[calc(100%-7.5rem)] rounded-full" ><Download /></Button>
                <CarouselPrevious className="top-[calc(100%+0.5rem)] translate-y-0 left-[calc(100%-4.5rem)]" />
                <CarouselNext className="top-[calc(100%+0.5rem)] translate-y-0 left-[calc(100%-4rem)] translate-x-full" />
            </Carousel>
            <div className="mt-4 flex items-center justify-start gap-2">
                {Array.from({ length: count }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={cn("h-3.5 w-3.5 rounded-full border-2", {
                            "border-primary": current === index,
                        })}
                    />
                ))}
            </div>
        </>
    )
}

export function ImageCarouselThumbnail({ images, onCardClick, onChangeIndex }: {
    images: { url: string }[];
    onCardClick?: () => void;
    onChangeIndex?: (index: number) => void;
}) {

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }
        setCurrent(api.selectedScrollSnap());
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
            if (onChangeIndex) {
                onChangeIndex(api.selectedScrollSnap());
            }
        });
    }, [api, onChangeIndex]);

    const onCardClickHandle = (index: number) => {
        if (!api) return;

        const length = images.length;

        if (length === 1) {
            if (index === current && onCardClick) {
                onCardClick();
            }
            return;
        }

        if (length === 2) {
            if (index === current && onCardClick) {
                onCardClick();
            } else {
                api.scrollTo(index);
            }
            return;
        }

        const prevIndex = (current - 1 + length) % length;
        const nextIndex = (current + 1) % length;

        if (index === prevIndex) {
            api.scrollPrev();
        } else if (index === nextIndex) {
            api.scrollNext();
        } else if (index === current && onCardClick) {
            onCardClick();
        }
    }

    return (
        <>
            <Carousel
                setApi={setApi}
                className="w-full max-w-[15rem]"
                opts={{ loop: true }}
            >
                <CarouselContent parentClassName="px-1 pb-2 pt-1">
                    {images.map((img, index) => (
                        <CarouselItem key={index} className="basis-[55%]">
                            <Card
                                onClick={() => { onCardClickHandle(index) }}
                                className={cn(
                                    "transition-opacity duration-300 aspect-square py-2 px-2 min-w-20 min-h-20",
                                    {
                                        "opacity-65": index !== current,
                                    }
                                )}
                            >
                                <CardContent className="relative h-full w-full overflow-hidden px-0">
                                    <Image
                                        src={img.url}
                                        alt={`Image (${index + 1})`}
                                        fill
                                        sizes="128px"
                                        className="object-contain cursor-pointer"
                                        quality={50}
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </>
    );
}