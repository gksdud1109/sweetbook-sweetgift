import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { CreateAlbumDraftSchema } from "../schemas/album-draft.js";
import { saveDraft, getDraft } from "../store/draft-store.js";
import type { StoredDraft } from "../store/draft-store.js";
import { AppError } from "../adapters/sweetbook/index.js";

export async function albumDraftRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/album-drafts
  app.post("/api/v1/album-drafts", async (req, reply) => {
    const parsed = CreateAlbumDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const input = parsed.data;
    const draftId = `draft_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

    // Generate preview pages from the validated input.
    // Page structure: cover → moments (sorted by date) → letter → closing
    const sortedMoments = [...input.moments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const generatedPages: StoredDraft["generatedPages"] = [
      {
        pageNumber: 1,
        type: "cover",
        title: input.title,
        photoUrl: input.coverPhotoUrl,
      },
      ...sortedMoments.map((m, i) => ({
        pageNumber: i + 2,
        type: "moment" as const,
        title: m.title,
        body: m.body,
        photoUrl: m.photoUrl,
      })),
      {
        pageNumber: sortedMoments.length + 2,
        type: "letter",
        title: `To. ${input.couple.receiverName}`,
        body: input.letter,
      },
      {
        pageNumber: sortedMoments.length + 3,
        type: "closing",
        title: input.title,
      },
    ];

    const draft: StoredDraft = {
      draftId,
      status: "draft",
      anniversaryType: input.anniversaryType,
      anniversaryDate: input.anniversaryDate,
      couple: input.couple,
      title: input.title,
      subtitle: input.subtitle,
      letter: input.letter,
      coverPhotoUrl: input.coverPhotoUrl,
      moments: sortedMoments.map((m, i) => ({
        id: `moment_${i + 1}`,
        ...m,
      })),
      generatedPages,
    };

    saveDraft(draft);

    return reply.status(201).send({
      data: {
        draftId: draft.draftId,
        status: draft.status,
        title: draft.title,
        subtitle: draft.subtitle,
        coverPhotoUrl: draft.coverPhotoUrl,
        generatedPages: draft.generatedPages,
      },
    });
  });

  // GET /api/v1/album-drafts/:draftId
  app.get<{ Params: { draftId: string } }>(
    "/api/v1/album-drafts/:draftId",
    async (req, reply) => {
      const { draftId } = req.params;
      const draft = getDraft(draftId);

      if (!draft) {
        throw new AppError("NOT_FOUND", `Draft '${draftId}' not found.`, 404);
      }

      return reply.send({
        data: {
          draftId: draft.draftId,
          status: draft.status,
          anniversaryType: draft.anniversaryType,
          anniversaryDate: draft.anniversaryDate,
          couple: draft.couple,
          title: draft.title,
          subtitle: draft.subtitle,
          letter: draft.letter,
          coverPhotoUrl: draft.coverPhotoUrl,
          moments: draft.moments,
          generatedPages: draft.generatedPages,
        },
      });
    },
  );
}
