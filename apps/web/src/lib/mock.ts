import type {
  AlbumDraftDetail,
  CreateAlbumDraftRequest,
  CreateBookResponse,
  CreateOrderResponse,
  GeneratedPage,
} from "@sweetgift/contracts";
import { wait } from "@/src/lib/utils";

function createId(prefix: "draft" | "book" | "order") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createGeneratedPages(input: CreateAlbumDraftRequest): GeneratedPage[] {
  const pages: GeneratedPage[] = [
    {
      pageNumber: 1,
      type: "cover",
      title: input.title,
      body: input.subtitle,
      photoUrl: input.coverPhotoUrl,
      decorations: [],
    },
  ];

  input.moments.forEach((moment, index) => {
    pages.push({
      pageNumber: index + 2,
      type: "moment",
      title: moment.title,
      body: moment.body,
      photoUrl: moment.photoUrl,
      decorations: moment.decorations ?? [],
    });
  });

  pages.push({
    pageNumber: pages.length + 1,
    type: "letter",
    title: `To. ${input.couple.receiverName}`,
    body: input.letter,
    decorations: [],
  });

  pages.push({
    pageNumber: pages.length + 1,
    type: "closing",
    title: "Our next chapter",
    body: `${input.couple.senderName}와 ${input.couple.receiverName}의 다음 장면도 이 책 뒤에 이어질 거예요.`,
    decorations: [],
  });

  return pages;
}

export async function createMockAlbumDraft(
  input: CreateAlbumDraftRequest,
): Promise<AlbumDraftDetail> {
  await wait(500);

  return {
    draftId: createId("draft"),
    status: "draft",
    anniversaryType: input.anniversaryType,
    anniversaryDate: input.anniversaryDate,
    couple: input.couple,
    title: input.title,
    subtitle: input.subtitle,
    letter: input.letter,
    coverPhotoUrl: input.coverPhotoUrl,
    moments: input.moments.map((moment, index) => ({
      id: `moment_${index + 1}`,
      ...moment,
    })),
    generatedPages: createGeneratedPages(input),
  };
}

export async function createMockBook(
  draftId: string,
): Promise<CreateBookResponse> {
  await wait(600);

  return {
    draftId,
    bookId: createId("book"),
    status: "book_created",
  };
}

export async function createMockOrder(
  bookId: string,
): Promise<CreateOrderResponse> {
  await wait(700);

  return {
    orderId: createId("order"),
    bookId,
    status: "ordered",
  };
}
