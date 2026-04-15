import { z } from "zod";
import {
  albumDraftDetailSchema,
  anniversaryTypeSchema,
  createBookResponseSchema,
  createOrderResponseSchema,
  decorationSchema,
} from "@sweetgift/contracts";

export const editableMomentSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  body: z.string(),
  photoUrl: z.string(),
  decorations: z.array(decorationSchema).default([]),
});

export const albumDraftFormStateSchema = z.object({
  anniversaryType: anniversaryTypeSchema,
  anniversaryLabel: z.string().default("100일"),
  anniversaryDate: z.string(),
  senderName: z.string(),
  receiverName: z.string(),
  title: z.string(),
  subtitle: z.string(),
  letter: z.string(),
  coverPhotoUrl: z.string(),
  coverDecorations: z.array(decorationSchema).default([]),
  moments: z.array(editableMomentSchema),
});

export const persistedFlowSchema = z.object({
  form: albumDraftFormStateSchema,
  draft: albumDraftDetailSchema.nullable(),
  book: createBookResponseSchema.nullable(),
  order: createOrderResponseSchema.nullable(),
  source: z.enum(["api", "mock"]),
});
