
import { z } from 'zod';

const passwordSchema = z.string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const setupAccountSchema = z.object({
      password: passwordSchema,
      confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Specifies where the error message should appear
});

export type SetupAccountInput = z.infer<typeof setupAccountSchema>;

export const initialValues: SetupAccountInput = {
  password: '',
  confirmPassword: '',
}

