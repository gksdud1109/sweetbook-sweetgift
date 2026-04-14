import { z } from "zod";

export const CreateBookSchema = z.object({
  draftId: z.string().min(1),
});

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
