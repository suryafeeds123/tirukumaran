import { z } from "zod";

export const VEHICLE_TYPES = ["car", "two_wheeler"] as const;
export const EMPLOYMENT_TYPES = ["salaried", "self_employed", "business"] as const;
export const CALLBACK_TIMES = ["morning", "afternoon", "evening", "anytime"] as const;
export const STATUSES = ["new", "contacted", "documents_pending", "under_review", "approved", "closed"] as const;

import { LOAN_LIMITS, normalizeMobile } from "./rules";
export { LOAN_LIMITS, CONSENT_VERSION, normalizeMobile } from "./rules";

// Reject control characters and markup-ish content in free-text fields.
const safeText = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.normalize("NFC").replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(min)
        .max(max)
        .refine((s) => !/[<>\u0000-\u001f]/.test(s)),
    );

export const enquirySchema = z.object({
  idempotencyKey: z.string().uuid(),
  vehicleType: z.enum(VEHICLE_TYPES),
  loanAmount: z.number().int().min(LOAN_LIMITS.min).max(LOAN_LIMITS.max),
  area: safeText(2, 80),
  employment: z.enum(EMPLOYMENT_TYPES),
  name: safeText(2, 80),
  mobile: z.string().transform((s, ctx) => {
    const n = normalizeMobile(s);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "mobile" });
      return z.NEVER;
    }
    return n;
  }),
  callbackTime: z.enum(CALLBACK_TIMES),
  consent: z.literal(true),
  language: z.enum(["en", "ta"]),
  // spam traps
  website: z.string().max(0).optional(), // honeypot, must stay empty
  openedAt: z.number().int().optional(), // client timestamp when the assistant opened
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const staffLoginSchema = z.object({
  email: z.string().email().max(120).transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(200),
});

export const enquiryUpdateSchema = z
  .object({
    status: z.enum(STATUSES),
    assignedTo: z.number().int().positive().nullable(),
    nextFollowUp: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00Z")))
      .nullable(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0);

export const noteSchema = z.object({
  body: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(2000)),
});
