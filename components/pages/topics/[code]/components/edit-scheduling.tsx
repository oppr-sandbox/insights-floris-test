"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { IconBulb } from "@tabler/icons-react";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { useCallback, useMemo, useState } from "react";
import { debounce } from "@/utils/helpers/helpers";
import { TopicStatus } from "../../data/schema";
import { DateRange } from "react-day-picker";


export default function Scheduling() {

    const { updateFormField, saveField, data } = useTopicDetail();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: data!.startDate,
        to: data!.endDate
    });
    const isMobile = useIsMobile();
    const isDraft = data!.status === TopicStatus.Draft;

    const debouncedSave = useMemo(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        debounce((value: Record<string, any>) => {
            saveField(value);
        }, 500),
        [saveField]
    );

    const updateSchedule = useCallback(
        (range: DateRange | undefined) => {
            setDateRange(range);
            const newDateRange = {
                startDate: range?.from ? range.from : null,
                endDate: range?.to ? range.to : null,
            }
            if (isDraft) {
                debouncedSave(newDateRange);
            } else {
                updateFormField(newDateRange);
            }
        },
        [debouncedSave, isDraft, updateFormField]
    );

    const onDateSelect = (val: DateRange | undefined) => {
        const currDate = new Date();
        currDate.setHours(0, 0, 0, 0);

        if (val && dateRange?.from && dateRange?.to) {
            const fromDate = val.from ? new Date(val.from) : undefined;
            const toDate = val.to ? new Date(val.to) : undefined;

            const savedFrom = new Date(dateRange.from);
            const savedTo = new Date(dateRange.to);

            // Case 1: both saved dates are fully in the past → do nothing
            if (savedFrom < currDate && savedTo < currDate && !isDraft) {
                updateSchedule({
                    from: savedFrom,
                    to: savedTo,
                });
            }
            // Case 2: start is in the past, but end is still valid → keep start, allow updating end
            else if (savedFrom < currDate && savedTo >= currDate && !isDraft) {
                updateSchedule({
                    from: savedFrom,
                    to: toDate ?? savedTo,
                });
            }
            // Case 3: both dates are valid (today or future) or its still in draft → allow full update
            else {
                updateSchedule({
                    from: fromDate ?? savedFrom,
                    to: toDate ?? savedTo,
                });
            }
        } else {
            updateSchedule(val);
        }

    };

    return (
        <TabsContent value="scheduling">
            <div className="flex flex-col space-y-4 mt-4">
                <div>
                    <h4 className="font-semibold">Scheduling</h4>
                    <p className="text-muted-foreground">Set when participants can provide feedback</p>
                </div>
                <Calendar
                    mode="range"
                    numberOfMonths={isMobile ? 1 : 3}
                    showOutsideDays={false}
                    selected={dateRange}
                    onSelect={onDateSelect}
                    disabled={(day) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return day < today;
                    }}
                    className="rounded-lg border shadow-sm w-full"
                />
                <Alert variant="warning">
                    <AlertTitle>
                        <div className="flex flex-row items-center space-x-1">
                            <IconBulb className="size-6" />
                            <h5>Scheduling Tips:</h5>
                        </div>
                    </AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc text-warning-foreground ps-6">
                            <li>Allow enough time for participants to provide thoughtful feedback</li>
                            <li>Consider time zones if working with global teams</li>
                            <li>End date should be at least 3 days after start date</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </div>
        </TabsContent>
    )
}