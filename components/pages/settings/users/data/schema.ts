import { z } from 'zod';

export const inviteUserSchema = z.object({
  firstName: z.string().min(2, {message: "First name must be at least 2 characters long."}),
  lastName: z.string().min(2, {message: "Last name must be at least 2 characters long."}),
  email: z.email(),
  role: z.string(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const initialValues: InviteUserInput = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'MEMBER',
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    position: string;
    username?: string;
    phoneNumber?: string;
    userImage?: string;
    isInvited: boolean;
}