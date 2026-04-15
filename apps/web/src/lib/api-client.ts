"use client";

import {
  apiErrorSchema,
  apiResponseSchema,
  albumDraftDetailSchema,
  albumDraftSummarySchema,
  createAlbumDraftRequestSchema,
  createBookRequestSchema,
  createBookResponseSchema,
  createOrderRequestSchema,
  createOrderResponseSchema,
  type AlbumDraftDetail,
  type CreateAlbumDraftRequest,
  type CreateBookRequest,
  type CreateBookResponse,
  type CreateOrderRequest,
  type CreateOrderResponse,
} from "@sweetgift/contracts";
import { z, ZodError, type ZodTypeAny } from "zod";
import {
  createMockAlbumDraft,
  createMockBook,
  createMockOrder,
} from "@/src/lib/mock";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type ApiResult<T> = {
  data: T;
  source: "api" | "mock";
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("이미지 미리보기를 생성하지 못했습니다."));
    };
    reader.onerror = () =>
      reject(new Error("이미지 미리보기를 생성하지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

type ErrorOptions = {
  code?: string;
  status?: number;
  fallbackEligible?: boolean;
};

export class ApiClientError extends Error {
  code?: string;
  status?: number;
  fallbackEligible: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code;
    this.status = options.status;
    this.fallbackEligible = Boolean(options.fallbackEligible);
  }
}

async function requestJson<TSchema extends ZodTypeAny>(
  path: string,
  init: RequestInit,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const parsedError = apiErrorSchema.safeParse(errorBody);

    if (parsedError.success) {
      const { code, message } = parsedError.data.error;
      throw new ApiClientError(message, {
        code,
        status: response.status,
        fallbackEligible:
          response.status === 404 ||
          response.status >= 500 ||
          code === "UPSTREAM_TIMEOUT" ||
          code === "UPSTREAM_ERROR",
      });
    }

    throw new ApiClientError("백엔드 응답을 해석하지 못했습니다.", {
      status: response.status,
      fallbackEligible: response.status === 404 || response.status >= 500,
    });
  }

  const body = await response.json();
  return apiResponseSchema(schema).parse(body).data;
}

function normalizeError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ApiClientError(error.issues[0]?.message ?? "입력 값을 확인해 주세요.");
  }

  return new ApiClientError("현재 서버에 연결할 수 없습니다.", {
    fallbackEligible: true,
  });
}

export async function uploadFile(file: File): Promise<string> {
  if (!API_BASE_URL) {
    return fileToDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const parsedError = apiErrorSchema.safeParse(errorBody);
    throw new ApiClientError(
      parsedError.success ? parsedError.data.error.message : "파일 업로드에 실패했습니다.",
      { status: response.status }
    );
  }

  const body = await response.json();
  return apiResponseSchema(z.object({ url: z.string() })).parse(body).data.url;
}

export async function createAlbumDraft(
  input: CreateAlbumDraftRequest,
): Promise<ApiResult<AlbumDraftDetail>> {
  const payload = createAlbumDraftRequestSchema.parse(input);

  if (!API_BASE_URL) {
    return {
      data: await createMockAlbumDraft(payload),
      source: "mock",
    };
  }

  try {
    const summary = await requestJson(
      "/api/v1/album-drafts",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      albumDraftSummarySchema,
    );
    return {
      data: {
        draftId: summary.draftId,
        status: summary.status,
        anniversaryType: payload.anniversaryType,
        anniversaryDate: payload.anniversaryDate,
        couple: payload.couple,
        title: summary.title,
        subtitle: summary.subtitle,
        letter: payload.letter,
        coverPhotoUrl: summary.coverPhotoUrl,
        moments: payload.moments.map((moment, index) => ({
          id: `moment_${index + 1}`,
          ...moment,
        })),
        generatedPages: summary.generatedPages,
      },
      source: "api",
    };
  } catch (postError) {
    throw normalizeError(postError);
  }
}

export async function getAlbumDraft(
  draftId: string,
): Promise<ApiResult<AlbumDraftDetail>> {
  if (!API_BASE_URL) {
    throw new ApiClientError("백엔드 연결 없이 조회할 수 없습니다.");
  }

  try {
    const data = await requestJson(
      `/api/v1/album-drafts/${draftId}`,
      { method: "GET" },
      albumDraftDetailSchema,
    );

    return {
      data,
      source: "api",
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createBook(
  input: CreateBookRequest,
): Promise<ApiResult<CreateBookResponse>> {
  const payload = createBookRequestSchema.parse(input);

  if (!API_BASE_URL) {
    return {
      data: await createMockBook(payload.draftId),
      source: "mock",
    };
  }

  try {
    return {
      data: await requestJson(
        "/api/v1/books",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        createBookResponseSchema,
      ),
      source: "api",
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createOrder(
  input: CreateOrderRequest,
): Promise<ApiResult<CreateOrderResponse>> {
  const payload = createOrderRequestSchema.parse(input);

  if (!API_BASE_URL) {
    return {
      data: await createMockOrder(payload.bookId),
      source: "mock",
    };
  }

  try {
    return {
      data: await requestJson(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        createOrderResponseSchema,
      ),
      source: "api",
    };
  } catch (error) {
    throw normalizeError(error);
  }
}
