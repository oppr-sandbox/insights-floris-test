'use client'

import { TabsContent } from "@/components/ui/tabs";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JSX, useMemo, useState } from "react";

interface ExportType {
    value: ExportTypeEnum,
    title: string,
    description: string,
    icon: JSX.Element
}

enum ExportTypeEnum {
    Csv = 'CSV',
    Excel = 'EXCEL',
    Json = 'JSON',
}

export default function Export() {
    const { data } = useTopicDetail();
    const [selectedRadio, setSelectedRadio] = useState<ExportTypeEnum>(ExportTypeEnum.Csv);

    const exportTypes = useMemo(() => [
        {
            value: ExportTypeEnum.Csv,
            title: 'CSV (Comma Separated Values)',
            description: 'Best for spreadsheet analysis and basic data manipulation',
            icon: <FileText className="size-4" />
        },
        {
            value: ExportTypeEnum.Excel,
            title: 'Excel Workbook (.xlsx)',
            description: 'Formatted workbook with multiple sheets and advanced features',
            icon: <FileSpreadsheet className="size-4" />
        },
        {
            value: ExportTypeEnum.Json,
            title: 'JSON (JavaScript Object Notation)',
            description: 'Raw data format for API integration and system processing',
            icon: <FileJson className="size-4" />
        }
    ], []);

    return (
        <TabsContent value="export">
            <div className="flex flex-col flex-1 gap-4">
                <Card className="py-5 px-1 gap-2">
                    <CardHeader>
                        <CardTitle className="flex gap-2 items-center">
                            <Download /><span className="text-lg">Export</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-2">
                        <div className="font-semibold">Select Export Format</div>
                        <RadioGroup
                            value={selectedRadio}
                            onValueChange={(val) => {
                                const value = val as ExportTypeEnum;
                                setSelectedRadio(value);
                            }}>
                            <div className="flex flex-col space-y-2">
                                {
                                    exportTypes.map(option => (
                                        <Label key={option.value} className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary/60 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-primary/90 dark:has-[[aria-checked=true]]:bg-blue-950">
                                            <RadioGroupItem
                                                id={option.value}
                                                value={option.value}
                                            />
                                            <div className="grid gap-1.5 font-normal w-full">
                                                <div className="flex space-x-1 items-center">
                                                    {option.icon}
                                                    <p className="text-base leading-none font-medium">
                                                        {option.title}
                                                    </p>
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </Label>
                                    ))
                                }
                            </div>
                        </RadioGroup>

                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    )
}