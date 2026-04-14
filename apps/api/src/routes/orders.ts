import type { FastifyInstance } from "fastify";
import { CreateOrderSchema } from "../schemas/order.js";
import {
  createOrder,
  mapUpstreamError,
} from "../adapters/sweetbook/index.js";
import {
  getDraftByBookId,
  updateDraft,
  getOrderIdByBookId,
  saveOrderId,
} from "../store/draft-store.js";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/orders
  //
  // Idempotency strategy:
  //   1. Primary guard: bookId → orderId index (getOrderIdByBookId).
  //      Works even when the draft cannot be found (corrupt store, external bookId).
  //   2. On success: saveOrderId(bookId, orderId) persists the mapping to disk,
  //      then updateDraft() updates the draft status if the draft exists.
  //
  //   This ensures the idempotency invariant holds regardless of whether
  //   getDraftByBookId() returns a result.
  //
  // TODO: add X-Idempotency-Key header support for cross-process safety
  //       (current approach is single-process only).
  app.post("/api/v1/orders", async (req, reply) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { bookId, recipient } = parsed.data;

    // Idempotency guard: bookId → orderId index is authoritative.
    // Does not depend on getDraftByBookId(), so it holds even after store corruption.
    const cachedOrderId = getOrderIdByBookId(bookId);
    if (cachedOrderId) {
      return reply.send({
        data: { orderId: cachedOrderId, bookId, status: "ordered" },
      });
    }

    let upstream;
    try {
      upstream = await createOrder({
        bookId,
        recipient: {
          name: recipient.name,
          phone: recipient.phone,
          address1: recipient.address1,
          address2: recipient.address2,
          zipCode: recipient.zipCode,
        },
      });
    } catch (err) {
      throw mapUpstreamError(err, "order");
    }

    // Persist the bookId → orderId mapping first (idempotency guarantee).
    // updateDraft() is best-effort: the index above is the source of truth.
    await saveOrderId(bookId, upstream.id);

    const existingDraft = getDraftByBookId(bookId);
    if (existingDraft) {
      await updateDraft(existingDraft.draftId, {
        status: "ordered",
        orderId: upstream.id,
      });
    }

    return reply.status(201).send({
      data: {
        orderId: upstream.id,
        bookId: upstream.bookId,
        status: "ordered",
      },
    });
  });
}
