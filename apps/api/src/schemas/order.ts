import { z } from "zod";

// Korean phone number: 010-XXXX-XXXX or 02-XXX-XXXX etc.
const PhoneSchema = z
  .string()
  .regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, "phone must match 0X0-XXXX-XXXX format");

export const CreateOrderSchema = z.object({
  bookId: z.string().min(1),
  recipient: z.object({
    name: z.string().min(1).max(50),
    phone: PhoneSchema,
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).default(""),
    zipCode: z.string().regex(/^\d{5}$/, "zipCode must be 5 digits"),
  }),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
