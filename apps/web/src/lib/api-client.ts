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

    const detail: AlbumDraftDetail = {
      ...(await createMockAlbumDraft(payload)),
      draftId: summary.draftId,
      status: summary.status,
      title: summary.title,
      subtitle: summary.subtitle,
      coverPhotoUrl: summary.coverPhotoUrl,
      generatedPages: summary.generatedPages,
    };

    return {
      data: detail,
      source: "api",
    };
  } catch (error) {
    const normalized = normalizeError(error);
    if (!normalized.fallbackEligible) {
      throw normalized;
    }

    return {
      data: await createMockAlbumDraft(payload),
      source: "mock",
    };
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
    const normalized = normalizeError(error);
    if (!normalized.fallbackEligible) {
      throw normalized;
    }

    return {
      data: await createMockBook(payload.draftId),
      source: "mock",
    };
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
    const normalized = normalizeError(error);
    if (!normalized.fallbackEligible) {
      throw normalized;
    }

    return {
      data: await createMockOrder(payload.bookId),
      source: "mock",
    };
  }
}
