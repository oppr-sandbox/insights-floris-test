import { z } from 'zod';

// const newPasswordSchema = z.string()
//     .min(8, "Password must be at least 8 characters long")
//     .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
//     .regex(/[a-z]/, "Password must contain at least one lowercase letter")
//     .regex(/[0-9]/, "Password must contain at least one number")
//     .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

const newPasswordSchema = z.string().superRefine((val, ctx) => {
    if (val.length < 8) {
        ctx.addIssue({
        code: "custom",
        message: "Password must be at least 8 characters long",
        });
    }
    if (!/[A-Z]/.test(val)) {
        ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one uppercase letter",
        });
    }
    if (!/[a-z]/.test(val)) {
        ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one lowercase letter",
        });
    }
    if (!/[0-9]/.test(val)) {
        ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one number",
        });
    }
    if (!/[^A-Za-z0-9]/.test(val)) {
        ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one special character",
        });
    }
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Specifies where the error message should appear
});;

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const initialValues: ChangePasswordInput = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
}

export interface ChangePasswordPayload {
    token: string;
    currentPassword: string;
    newPassword: string;
}