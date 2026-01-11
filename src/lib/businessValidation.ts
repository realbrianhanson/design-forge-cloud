import { z } from 'zod';

export const businessFormSchema = z.object({
  // Basic Information
  name: z
    .string()
    .trim()
    .min(1, 'Business name is required')
    .max(100, 'Name must be less than 100 characters'),
  category: z
    .string()
    .min(1, 'Category is required'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  // Location
  address: z
    .string()
    .trim()
    .min(1, 'Street address is required')
    .max(200, 'Address must be less than 200 characters'),
  city: z
    .string()
    .trim()
    .max(100, 'City must be less than 100 characters')
    .default('Jacksonville'),
  state: z
    .string()
    .length(2, 'State must be 2 characters')
    .default('FL'),
  zipCode: z
    .string()
    .trim()
    .min(5, 'ZIP code is required')
    .max(10, 'Invalid ZIP code')
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  neighborhoodId: z
    .string()
    .optional()
    .or(z.literal('')),

  // Contact
  phone: z
    .string()
    .trim()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .trim()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),

  // Additional Details
  priceLevel: z
    .number()
    .min(1)
    .max(4)
    .optional(),

  // Ownership
  isOwner: z
    .boolean()
    .default(false),
});

export type BusinessFormData = z.infer<typeof businessFormSchema>;

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
};
