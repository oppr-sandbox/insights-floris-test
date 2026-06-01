import { z } from "zod";

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

export const resetPasswordSchema = z
    .object({
        newPassword: newPasswordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // Specifies where the error message should appear
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const initialValues: ResetPasswordInput = {
    newPassword: "",
    confirmPassword: "",
};

export interface ResetPasswordPayload {
    newPassword: string;
    accessToken: string;
    refreshToken: string;
}

export interface RequestPasswordResetPayload {
    email: string;
    type: ResetPasswordType;
}

export enum ResetPasswordType {
    ChangePassword = 1,
    ForgotPassword,
}
