import type {
  AnniversaryType,
  CreateAlbumDraftRequest,
  CreateBookResponse,
  CreateOrderResponse,
  Recipient,
  AlbumDraftDetail,
  decorationSchema,
} from "@sweetgift/contracts";
import { createAlbumDraftRequestSchema, recipientSchema } from "@sweetgift/contracts";
import { z } from "zod";

export type RuntimeSource = "api" | "mock";

export type Decoration = z.infer<typeof decorationSchema>;

export type EditableMoment = {
  id: string;
  date: string;
  title: string;
  body: string;
  photoUrl: string;
  decorations: Decoration[];
};

export type AlbumDraftFormState = {
  anniversaryType: AnniversaryType;
  anniversaryDate: string;
  senderName: string;
  receiverName: string;
  title: string;
  subtitle: string;
  letter: string;
  coverPhotoUrl: string;
  coverDecorations: Decoration[];
  moments: EditableMoment[];
};

export type OrderFormState = Recipient & {
  packaging: "matte" | "glossy";
  ribbon: "none" | "red" | "gold";
  giftCard: boolean;
};

export type PersistedFlow = {
  form: AlbumDraftFormState;
  draft: AlbumDraftDetail | null;
  book: CreateBookResponse | null;
  order: CreateOrderResponse | null;
  source: RuntimeSource;
};

export const STORAGE_KEY = "sweetgift-flow-v1";

function createBlankMoment(index: number): EditableMoment {
  return {
    id: `moment_${index + 1}`,
    date: "",
    title: "",
    body: "",
    photoUrl: "",
    decorations: [],
  };
}

export function createInitialFormState(): AlbumDraftFormState {
  return {
    anniversaryType: "100days",
    anniversaryDate: "",
    senderName: "",
    receiverName: "",
    title: "",
    subtitle: "사진과 편지로 만드는 기념일 앨범",
    letter: "",
    coverPhotoUrl: "",
    coverDecorations: [],
    moments: [createBlankMoment(0), createBlankMoment(1), createBlankMoment(2)],
  };
}

export function cloneFormState(form: AlbumDraftFormState): AlbumDraftFormState {
  return {
    ...form,
    moments: form.moments.map((moment) => ({ ...moment, decorations: [...moment.decorations] })),
  };
}

export function createInitialFlowState(): PersistedFlow {
  return {
    form: createInitialFormState(),
    draft: null,
    book: null,
    order: null,
    source: "mock",
  };
}

export function createInitialOrderFormState(
  recipientName = "",
): OrderFormState {
  return {
    name: recipientName,
    phone: "",
    address1: "",
    address2: "",
    zipCode: "",
    packaging: "matte",
    ribbon: "none",
    giftCard: false,
  };
}

export function addQuickMoments(form: AlbumDraftFormState): AlbumDraftFormState {
  if (form.moments.length >= 8) {
    return form;
  }

  const { sampleDraftForm } = require("@/src/data/sample-draft");
  const currentTitles = new Set(form.moments.map((m) => m.title));
  const availableSamples = sampleDraftForm.moments.filter(
    (m: any) => !currentTitles.has(m.title),
  );

  const toAdd = availableSamples.slice(0, Math.min(3, 8 - form.moments.length));

  if (toAdd.length === 0) {
    return addBlankMoment(form);
  }

  return {
    ...form,
    moments: [
      ...form.moments,
      ...toAdd.map((s: any) => ({
        ...s,
        id: `quick_${Math.random().toString(36).slice(2, 9)}`,
        decorations: s.decorations || [],
      })),
    ],
  };
}

export function addBlankMoment(form: AlbumDraftFormState) {
  if (form.moments.length >= 8) {
    return form;
  }

  return {
    ...form,
    moments: [
      ...form.moments,
      {
        ...createBlankMoment(form.moments.length),
        id: `moment_${Date.now().toString(36)}`,
      },
    ],
  };
}

export function removeMoment(form: AlbumDraftFormState, id: string) {
  if (form.moments.length <= 3) {
    return form;
  }

  return {
    ...form,
    moments: form.moments.filter((moment) => moment.id !== id),
  };
}

export function toDraftRequest(
  form: AlbumDraftFormState,
): CreateAlbumDraftRequest {
  const toAbsoluteUrl = (value: string) => {
    if (!value.startsWith("/")) {
      return value.trim();
    }

    if (typeof window === "undefined") {
      return value.trim();
    }

    return new URL(value.trim(), window.location.origin).toString();
  };

  return createAlbumDraftRequestSchema.parse({
    anniversaryType: form.anniversaryType,
    anniversaryDate: form.anniversaryDate,
    couple: {
      senderName: form.senderName.trim(),
      receiverName: form.receiverName.trim(),
    },
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    letter: form.letter.trim(),
    coverPhotoUrl: toAbsoluteUrl(form.coverPhotoUrl),
    moments: form.moments
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((moment) => ({
        date: moment.date,
        title: moment.title.trim(),
        body: moment.body.trim(),
        photoUrl: toAbsoluteUrl(moment.photoUrl),
        decorations: moment.decorations,
      })),
  });
}

export function toOrderRequest(
  bookId: string,
  orderForm: OrderFormState,
): { bookId: string; recipient: Recipient } {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { packaging, ribbon, giftCard, ...recipient } = orderForm;
  return {
    bookId,
    recipient: recipientSchema.parse(recipient),
  };
}
