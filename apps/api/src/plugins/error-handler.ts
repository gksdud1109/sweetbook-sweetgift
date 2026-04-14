import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../adapters/sweetbook/index.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _req, reply) => {
    // ZodError from route-level validation
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: err.flatten().fieldErrors,
        },
      });
    }

    // Our own domain errors
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        error: {
          code: err.code,
          message: err.message,
          details: err.details ?? null,
        },
      });
    }

    // Fastify's own validation errors (JSON schema, if used)
    if (err.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: err.validation,
        },
      });
    }

    // Unhandled / unexpected errors — do not leak internals
    app.log.error(err);
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        details: null,
      },
    });
  });
}
