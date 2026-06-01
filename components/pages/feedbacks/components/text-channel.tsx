import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Type } from "lucide-react";
import { useFeedbackForm } from "../hooks/useFeedbackForm";

export default function TextChannel() {

    const {
        isActive,
        formData,
        handleChange,
    } = useFeedbackForm()

    return (
        <Card className="mb-2">
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
                            <Type />
                        </div>
                        <h3 className="font-semibold leading-none tracking-tight text-h3">
                            Additional Text Input
                        </h3>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <Textarea
                        value={formData.text}
                        readOnly={!isActive}
                        onChange={(e) => handleChange('text', e.currentTarget.value)}
                        placeholder="Any additional text feedback here.">
                    </Textarea>
                </div>
            </CardContent>
        </Card>
    )
}