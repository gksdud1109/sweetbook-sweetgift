import type { FastifyInstance } from "fastify";
import { CreateOrderSchema } from "../schemas/order.js";
import {
  createOrder,
  mapUpstreamError,
} from "../adapters/sweetbook/index.js";
import { getDraftByBookId, updateDraft } from "../store/draft-store.js";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/orders
  //
  // Idempotency: if the same bookId was already successfully ordered,
  // return the cached orderId without calling SweetBook again.
  // This guards against double-click, network retry, and response-loss retries.
  //
  // Limitation: the draft store is in-memory — idempotency is lost on restart.
  // TODO: persist orderId in a durable store and add X-Idempotency-Key support
  //       for cross-process safety.
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

    // Idempotency guard: return cached result if this book was already ordered
    const existingDraft = getDraftByBookId(bookId);
    if (existingDraft?.status === "ordered" && existingDraft.orderId) {
      return reply.send({
        data: {
          orderId: existingDraft.orderId,
          bookId,
          status: "ordered",
        },
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

    // Persist orderId so retries return the same result
    if (existingDraft) {
      updateDraft(existingDraft.draftId, {
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
