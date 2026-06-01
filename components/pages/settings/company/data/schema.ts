import { z } from 'zod';

export const companySchema = z.object({
  companyName: z.string().min(3, {message: "Company name must be at least 3 characters long."}),
  companyEmail: z.email().optional(),
  companyPhone: z.string().optional(),
  countryId: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  languageId: z.string().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;

export const initialValues: CompanyInput = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  languageId: '',
  street: '',
  postalCode: '',
  city: '',
  countryId: '',
}

export interface CompanyDetails {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  languageId?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  countryId?: string;
}

export interface Language {
  id: string;
  name: string;
  languageCode: string;
}

export interface Country {
  id: string;
  name: string;
  countryCode: string;
}