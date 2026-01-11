import { z } from 'zod';

export const eventSubmissionSchema = z.object({
  // Basic Information
  title: z.string()
    .min(1, 'Event title is required')
    .max(100, 'Title must be less than 100 characters'),
  category: z.enum(['music', 'sports', 'family', 'food', 'arts', 'community', 'business', 'nightlife'], {
    required_error: 'Please select a category',
  }),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  
  // Date & Time
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(false),
  
  // Location
  isVirtual: z.boolean().default(false),
  venueName: z.string().min(1, 'Venue name is required'),
  streetAddress: z.string().optional(),
  city: z.string().default('Jacksonville'),
  state: z.string().default('FL'),
  zipCode: z.string().optional(),
  neighborhoodId: z.string().optional(),
  virtualEventUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  // Tickets & Pricing
  priceType: z.enum(['free', 'paid', 'donation']).default('free'),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  ticketUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  // Organizer Information
  organizerName: z.string().min(1, 'Organizer name is required'),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
}).refine((data) => {
  // If not virtual, require street address and zip
  if (!data.isVirtual) {
    return data.streetAddress && data.streetAddress.length > 0 && data.zipCode && data.zipCode.length > 0;
  }
  return true;
}, {
  message: 'Street address and ZIP code are required for in-person events',
  path: ['streetAddress'],
}).refine((data) => {
  // If virtual, require virtual event URL
  if (data.isVirtual) {
    return data.virtualEventUrl && data.virtualEventUrl.length > 0;
  }
  return true;
}, {
  message: 'Virtual event URL is required for online events',
  path: ['virtualEventUrl'],
});

export type EventSubmissionFormData = z.infer<typeof eventSubmissionSchema>;
