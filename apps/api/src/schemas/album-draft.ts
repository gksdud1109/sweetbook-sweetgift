import { z } from "zod";

const PhotoUrl = z.string().url("photoUrl must be a valid URL");

const MomentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(1000),
  photoUrl: PhotoUrl,
});

export const CreateAlbumDraftSchema = z.object({
  anniversaryType: z.enum(["100days", "200days", "1year", "custom"]),
  anniversaryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "anniversaryDate must be YYYY-MM-DD"),
  couple: z.object({
    senderName: z.string().min(1).max(50),
    receiverName: z.string().min(1).max(50),
  }),
  title: z.string().min(1).max(40),
  subtitle: z.string().max(80).default(""),
  letter: z.string().min(1).max(2000),
  coverPhotoUrl: PhotoUrl,
  moments: z.array(MomentSchema).min(3).max(8),
});

export type CreateAlbumDraftInput = z.infer<typeof CreateAlbumDraftSchema>;
