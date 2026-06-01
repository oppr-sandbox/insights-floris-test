import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";

export default function CopyToClipboardButton({ text }: { text: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyClick = async (text: string) => {
        try {
            toast.promise(navigator.clipboard.writeText(text), {
                success: () => "Copied to clipboard!"
            });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text.');
        }
    };

    return (
        <Button
            className="opacity-70 group-hover:opacity-100 transition-opacity"
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => handleCopyClick(text)}
        >
            {isCopied ? <ClipboardCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
        </Button>
    )
}
