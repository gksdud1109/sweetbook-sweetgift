import type { FastifyInstance } from "fastify";
import { CreateBookSchema } from "../schemas/book.js";
import { getDraft, updateDraft } from "../store/draft-store.js";
import {
  createBook,
  mapUpstreamError,
  AppError,
} from "../adapters/sweetbook/index.js";

export async function bookRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/books
  //
  // Idempotency concern:
  //   If the same draftId is submitted twice (e.g. double-click, network retry),
  //   this endpoint will call SweetBook again and create a second book.
  //   For production, add an idempotency key and persist the bookId so
  //   a second call returns the existing result.
  //   TODO: return cached bookId if draft.status === "book_created".
  app.post("/api/v1/books", async (req, reply) => {
    const parsed = CreateBookSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { draftId } = parsed.data;
    const draft = getDraft(draftId);

    if (!draft) {
      throw new AppError("NOT_FOUND", `Draft '${draftId}' not found.`, 404);
    }

    // Guard: if this draft already has a book (or is already ordered),
    // return the cached bookId rather than creating a duplicate at SweetBook.
    if (
      (draft.status === "book_created" || draft.status === "ordered") &&
      draft.bookId
    ) {
      return reply.send({
        data: {
          draftId: draft.draftId,
          bookId: draft.bookId,
          status: "book_created",
        },
      });
    }

    // Map our draft into the SweetBook Books API payload.
    // Adapter layer isolates the shape translation so upstream changes
    // don't leak into the rest of the codebase.
    let upstream;
    try {
      upstream = await createBook({
        title: draft.title,
        subtitle: draft.subtitle,
        coverPhotoUrl: draft.coverPhotoUrl,
        pages: draft.generatedPages.map((p) => ({
          pageNumber: p.pageNumber,
          type: p.type,
          title: p.title,
          body: p.body,
          photoUrl: p.photoUrl,
        })),
      });
    } catch (err) {
      throw mapUpstreamError(err, "book");
    }

    // Persist bookId so retries are idempotent
    updateDraft(draftId, { status: "book_created", bookId: upstream.id });

    return reply.status(201).send({
      data: {
        draftId,
        bookId: upstream.id,
        status: "book_created",
      },
    });
  });
}
