import { nanoid } from 'nanoid';
import { z } from 'zod';

export type RoomDocumentType = z.infer<typeof roomZodSchema>;

// Define the social media type enum
const SocialMediaType = z.enum([
  'Facebook',
  'Twitter',
  'Instagram',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Other'
]);

export const roomZodSchema = z.object({
  _id: z.any().optional(),
  name: z.string().trim().min(6).max(40),
  bannerImageUrl: z.string().trim().optional(),
  tagLine: z.string().min(6).max(40).optional(),
  announcement: z.string().min(10).max(256).optional(),
  uniqueUrl: z
    .string()
    .trim()
    .toLowerCase()
    .min(5)
    .max(40)
    .default(() => nanoid()),
  active: z.boolean().default(true),
  // Social media links with enum type
  socialMediaLinks: z
    .array(
      z.object({
        type: SocialMediaType, // Enum for social media type
        link: z.string().url(), // Actual URL to the social media profile
        displayUrl: z.string().url().optional(), // Display URL (optional)
        icon: z.string().url().optional() // URL to the icon image (optional)
      })
    )
    .optional()
});
