import { z } from 'zod';

export const namingConventionSchema = z.object({
  code: z.string()
    .min(2, {message: "Code must be at least 2 characters long."})
    .max(3, {message: "Code must not exceed to 3 characters."}),
  name: z.string().min(3, {message: "Name must be at least 3 characters long."}),
});

export type NamingConventionInput = z.infer<typeof namingConventionSchema>;

export const initialValues: NamingConventionInput = {
    code: '',
    name: ''
}

export interface NamingConvention<T extends string = string> {
  id: string;
  name: string;
  code: string;
  type?: T;
}

export type Location = NamingConvention<'location'>;
export type Discipline = NamingConvention<'discipline'>;