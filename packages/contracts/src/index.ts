import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.");

const phoneSchema = z
  .string()
  .regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, "연락처 형식은 010-0000-0000 이어야 합니다.");

const zipCodeSchema = z
  .string()
  .regex(/^\d{5}$/, "우편번호는 5자리 숫자여야 합니다.");

export const anniversaryTypeSchema = z.enum([
  "100days",
  "200days",
  "1year",
  "custom",
]);

export const decorationSchema = z.object({
  id: z.string(),
  type: z.enum(["emoji", "sticker"]),
  value: z.string(),
  x: z.number(), // 0-100 (percent)
  y: z.number(), // 0-100 (percent)
  scale: z.number().default(1),
  rotate: z.number().default(0),
});

export const momentInputSchema = z.object({
  date: isoDateSchema,
  title: z
    .string()
    .min(1, "추억 제목을 입력해 주세요.")
    .max(40, "추억 제목은 40자 이하여야 합니다."),
  body: z
    .string()
    .min(1, "추억 설명을 입력해 주세요.")
    .max(300, "추억 설명은 300자 이하여야 합니다."),
  photoUrl: z.string().url("사진 URL 형식이 올바르지 않습니다."),
  decorations: z.array(decorationSchema).optional().default([]),
});

export const momentSchema = momentInputSchema.extend({
  id: z.string(),
});

export const generatedPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  type: z.enum(["cover", "moment", "letter", "closing"]),
  title: z.string().optional(),
  body: z.string().optional(),
  photoUrl: z.string().url().optional(),
  decorations: z.array(decorationSchema).optional().default([]),
});

export const createAlbumDraftRequestSchema = z.object({
  anniversaryType: anniversaryTypeSchema,
  anniversaryDate: isoDateSchema,
  couple: z.object({
    senderName: z
      .string()
      .min(1, "보내는 사람 이름을 입력해 주세요.")
      .max(20, "이름은 20자 이하여야 합니다."),
    receiverName: z
      .string()
      .min(1, "받는 사람 이름을 입력해 주세요.")
      .max(20, "이름은 20자 이하여야 합니다."),
  }),
  title: z
    .string()
    .min(1, "앨범 제목을 입력해 주세요.")
    .max(40, "제목은 40자 이하여야 합니다."),
  subtitle: z
    .string()
    .max(80, "부제는 80자 이하여야 합니다.")
    .default(""),
  letter: z
    .string()
    .min(1, "편지를 입력해 주세요.")
    .max(2000, "편지는 2000자 이하여야 합니다."),
  coverPhotoUrl: z.string().url("표지 사진 URL 형식이 올바르지 않습니다."),
  moments: z
    .array(momentInputSchema)
    .min(3, "추억은 최소 3개가 필요합니다.")
    .max(8, "추억은 최대 8개까지만 입력할 수 있습니다."),
});

export const albumDraftSummarySchema = z.object({
  draftId: z.string(),
  status: z.enum(["draft", "book_created", "ordered"]),
  title: z.string(),
  subtitle: z.string(),
  coverPhotoUrl: z.string().url(),
  generatedPages: z.array(generatedPageSchema),
});

export const albumDraftDetailSchema = albumDraftSummarySchema.extend({
  anniversaryType: anniversaryTypeSchema,
  anniversaryDate: z.string(),
  couple: z.object({
    senderName: z.string(),
    receiverName: z.string(),
  }),
  letter: z.string(),
  moments: z.array(momentSchema),
});

export const createBookRequestSchema = z.object({
  draftId: z.string(),
});

export const createBookResponseSchema = z.object({
  draftId: z.string(),
  bookId: z.string(),
  status: z.literal("book_created"),
});

export const recipientSchema = z.object({
  name: z
    .string()
    .min(1, "수령인 이름을 입력해 주세요.")
    .max(30, "수령인 이름은 30자 이하여야 합니다."),
  phone: phoneSchema,
  address1: z
    .string()
    .min(1, "기본 주소를 입력해 주세요.")
    .max(120, "기본 주소는 120자 이하여야 합니다."),
  address2: z
    .string()
    .max(120, "상세 주소는 120자 이하여야 합니다.")
    .default(""),
  zipCode: zipCodeSchema,
});

export const createOrderRequestSchema = z.object({
  bookId: z.string(),
  recipient: recipientSchema,
});

export const createOrderResponseSchema = z.object({
  orderId: z.string(),
  bookId: z.string(),
  status: z.literal("ordered"),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "UPSTREAM_TIMEOUT",
      "UPSTREAM_ERROR",
      "BOOK_CREATION_FAILED",
      "ORDER_CREATION_FAILED",
      "INTERNAL_ERROR",
    ]),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema,
  });

export type AnniversaryType = z.infer<typeof anniversaryTypeSchema>;
export type MomentInput = z.infer<typeof momentInputSchema>;
export type Moment = z.infer<typeof momentSchema>;
export type GeneratedPage = z.infer<typeof generatedPageSchema>;
export type CreateAlbumDraftRequest = z.infer<
  typeof createAlbumDraftRequestSchema
>;
export type AlbumDraftSummary = z.infer<typeof albumDraftSummarySchema>;
export type AlbumDraftDetail = z.infer<typeof albumDraftDetailSchema>;
export type CreateBookRequest = z.infer<typeof createBookRequestSchema>;
export type CreateBookResponse = z.infer<typeof createBookResponseSchema>;
export type Recipient = z.infer<typeof recipientSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
