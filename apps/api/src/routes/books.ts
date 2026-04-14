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
  // Idempotency: draft.status guard returns cached bookId for repeated requests.
  //
  // TODO (race condition): two concurrent POST /books requests with the same
  // draftId can both pass the status guard before either calls updateDraft(),
  // resulting in TWO books created at SweetBook and potential double-charging.
  // The second bookId silently overwrites the first in the DB.
  // Fix: per-draftId in-process mutex (Map<string,Promise>) or DB-level
  // optimistic lock (UPDATE ... WHERE status='draft' returning changed rows).
  // Out of scope for this MVP but MUST be addressed before real SweetBook billing.
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
    await updateDraft(draftId, { status: "book_created", bookId: upstream.id });

    return reply.status(201).send({
      data: {
        draftId,
        bookId: upstream.id,
        status: "book_created",
      },
    });
  });
}
