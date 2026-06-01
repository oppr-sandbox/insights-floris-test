'use client'

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerModal({ url, fileName }: { url: string; fileName: string }) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState(false);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const downloadPdf = () => {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <p className="text-sm text-muted-foreground">Failed to load PDF.</p>
                <Button variant="outline" size="sm" onClick={downloadPdf}>
                    <Download className="mr-2 size-4" />
                    Download instead
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="overflow-auto max-h-[70vh] w-full flex justify-center rounded-md border bg-muted/30">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={() => setError(true)}
                    loading={
                        <div className="flex items-center justify-center py-24">
                            <Spinner />
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        width={700}
                        loading={
                            <div className="flex items-center justify-center py-24">
                                <Spinner />
                            </div>
                        }
                    />
                </Document>
            </div>

            {numPages > 0 && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((p) => p - 1)}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber((p) => p + 1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 ml-2" onClick={downloadPdf}>
                        <Download className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
