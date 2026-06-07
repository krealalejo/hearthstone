import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, {
    message: "Password must contain at least 1 uppercase letter",
  })
  .regex(/\d/, { message: "Password must contain at least 1 number" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least 1 symbol",
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

export const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  desc: z.string().max(500).optional(),
  roomId: z.string().optional(),
  assignee: z.string().nullable().optional(),
  xp: z.number().int().min(0).max(1000).optional(),
  recurring: z.boolean().optional(),
  done: z.boolean().optional(),
  doneBy: z.string().nullable().optional(),
});

export const inventorySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  cat: z.enum(["food", "cleaning", "misc"]).optional(),
  qty: z.number().min(0).optional(),
  min: z.number().min(0).optional(),
  optimal: z.number().min(0).optional(),
  price: z.number().min(0).nullable().optional(),
  icon: z.string().optional(),
});

export const shoppingSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  source: z.enum(["auto", "manual"]).optional(),
  invId: z.string().nullable().optional(),
  qty: z.number().min(0).optional(),
  price: z.number().min(0).nullable().optional(),
  checked: z.boolean().optional(),
});

export const householdPatchSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    emoji: z.string().optional(),
    lastResetWeek: z.string().optional(),
    weekStartDay: z.enum(["monday", "sunday"]).optional(),
    currency: z.string().max(10).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.emoji !== undefined ||
      d.lastResetWeek !== undefined ||
      d.weekStartDay !== undefined ||
      d.currency !== undefined,
    { message: "At least one field required" },
  );

export function validate<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    throw createError({ statusCode: 400, statusMessage: message });
  }
  return result.data;
}
