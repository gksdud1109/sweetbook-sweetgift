import type { FastifyInstance } from "fastify";
import { CreateOrderSchema } from "../schemas/order.js";
import {
  createOrder,
  mapUpstreamError,
} from "../adapters/sweetbook/index.js";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/orders
  //
  // Idempotency concern:
  //   A retry of this endpoint will create a duplicate order at SweetBook.
  //   For production, require an idempotency key header and persist the
  //   orderId keyed on it.
  //   TODO: accept X-Idempotency-Key and store order result in draft store.
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

    return reply.status(201).send({
      data: {
        orderId: upstream.id,
        bookId: upstream.bookId,
        status: "ordered",
      },
    });
  });
}
