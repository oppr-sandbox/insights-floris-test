import { z } from "zod";
import { TopicChannels } from "./schema";

export const topicDetailSchema = z.object({
    name: z.string()
        .min(1, { error: "Title is required" })
        .max(100, { error: "Title must not exceed 100 characters" }),
    description: z.string({ error: "Description is required" })
        .min(1, { error: "Description is required" })
        .max(500, { error: "Description must not exceed 500 characters" }),
    content: z.string().nullable().optional(),
    channels: z.array(z.enum(TopicChannels))
        .min(1, "At least one channel is required"),
    startDate: z.date({ error: "Start date is required" }),
    endDate: z.date({ error: "End date is required" }),
    isAllUsers: z.boolean(),
    userIds: z.array(z.string()).optional(),
})
    .superRefine((data, ctx) => {
        if (data.startDate > data.endDate) {
            ctx.addIssue({
                code: 'custom',
                message: "End date must be later than start date",
                path: ["endDate"],
            });
        }

        if (!data.isAllUsers && (!data.userIds || data.userIds.length === 0)) {
            ctx.addIssue({
                code: 'custom',
                message: "Topic cannot be private when publishing, Please select atleast one user ",
                path: ["userIds"],
            });
        }
    });

export type TopicDetailValidated = z.infer<typeof topicDetailSchema>;

export const topicCreationSchema = z.object({
    name: z.string()
        .min(1, { error: "Topic Name is required" })
        .max(100, { error: "Topic Name must not exceed 100 characters" }),
    locationId: z.string().min(1, { error: "Location is required" }),
    disciplineId: z.string().min(1, { error: "Discipline is required" })
})

export type TopicCreation = z.infer<typeof topicCreationSchema>;

