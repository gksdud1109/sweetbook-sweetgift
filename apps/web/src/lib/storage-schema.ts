import { z } from "zod";
import {
  albumDraftDetailSchema,
  anniversaryTypeSchema,
  createBookResponseSchema,
  createOrderResponseSchema,
} from "@sweetgift/contracts";

export const editableMomentSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  body: z.string(),
  photoUrl: z.string(),
});

export const albumDraftFormStateSchema = z.object({
  anniversaryType: anniversaryTypeSchema,
  anniversaryDate: z.string(),
  senderName: z.string(),
  receiverName: z.string(),
  title: z.string(),
  subtitle: z.string(),
  letter: z.string(),
  coverPhotoUrl: z.string(),
  moments: z.array(editableMomentSchema),
});

export const persistedFlowSchema = z.object({
  form: albumDraftFormStateSchema,
  draft: albumDraftDetailSchema.nullable(),
  book: createBookResponseSchema.nullable(),
  order: createOrderResponseSchema.nullable(),
  source: z.enum(["api", "mock"]),
});
