import { nanoid } from 'nanoid';
import { z } from 'zod';

export type RoomDocumentType = z.infer<typeof roomZodSchema>;

export const roomZodSchema = z.object({
  _id: z.any().optional(),
  name: z.string().trim().min(6).max(40),
  coverImageUrl: z.string().trim().optional(),
  tagLine: z.string().min(6).max(40).optional(),
  announcement: z.string().min(10).max(256).optional(),
  uniqueUrl: z
    .string()
    .trim()
    .toLowerCase()
    .min(5)
    .max(40)
    .default(() => nanoid()),
  active: z.boolean().default(true)
});
