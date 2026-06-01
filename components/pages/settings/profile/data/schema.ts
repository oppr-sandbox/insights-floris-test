import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(2, {message: "First name must be at least 2 characters long."}),
  lastName: z.string().min(2, {message: "Last name must be at least 2 characters long."}),
  email: z.email(),
  phoneNumber: z.string().optional(),
  locationId: z.string().optional(),
  disciplineId: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const initialValues: ProfileInput = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  locationId: '',
  disciplineId: '',
}

export interface ResetPasswordPayload {
  email: string;
}