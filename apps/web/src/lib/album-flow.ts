import type {
  AnniversaryType,
  CreateAlbumDraftRequest,
  CreateBookResponse,
  CreateOrderResponse,
  Recipient,
  AlbumDraftDetail,
} from "@sweetgift/contracts";
import { createAlbumDraftRequestSchema, recipientSchema } from "@sweetgift/contracts";

export type RuntimeSource = "api" | "mock";

export type EditableMoment = {
  id: string;
  date: string;
  title: string;
  body: string;
  photoUrl: string;
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
  moments: EditableMoment[];
};

export type OrderFormState = Recipient;

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
    moments: [createBlankMoment(0), createBlankMoment(1), createBlankMoment(2)],
  };
}

export function cloneFormState(form: AlbumDraftFormState): AlbumDraftFormState {
  return {
    ...form,
    moments: form.moments.map((moment) => ({ ...moment })),
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
  };
}

export function addQuickMoments(form: AlbumDraftFormState): AlbumDraftFormState {
  if (form.moments.length >= 8) {
    return form;
  }

  // sampleDraftForm에서 현재 폼에 없는 샘플을 찾아 최대 3개까지 추가
  const { sampleDraftForm } = require("@/src/data/sample-draft");
  const currentTitles = new Set(form.moments.map((m) => m.title));
  const availableSamples = sampleDraftForm.moments.filter(
    (m: EditableMoment) => !currentTitles.has(m.title),
  );

  const toAdd = availableSamples.slice(0, Math.min(3, 8 - form.moments.length));

  if (toAdd.length === 0) {
    return addBlankMoment(form);
  }

  return {
    ...form,
    moments: [
      ...form.moments,
      ...toAdd.map((s: EditableMoment) => ({
        ...s,
        id: `quick_${Math.random().toString(36).slice(2, 9)}`,
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
      })),
  });
}

export function toOrderRequest(
  bookId: string,
  orderForm: OrderFormState,
): { bookId: string; recipient: Recipient } {
  return {
    bookId,
    recipient: recipientSchema.parse(orderForm),
  };
}
