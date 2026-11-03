import { z } from "zod";
import { Constants } from "@/lib/constants";

// Empty form fields arrive as "", which we store as null.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => (value === "" ? null : value));

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || /^https?:\/\/\S+\.\S+/.test(value), "Enter a full web address starting with https://");

const optionalMoney = z
  .string()
  .trim()
  .transform((value) => value.replace(/,/g, ""))
  .refine((value) => value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) < 1e12), "Enter an amount in rupees, like 250000")
  .transform((value) => (value === "" ? null : Number(value)));

export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: "Passwords don't match", path: ["confirm"] });

const currentYear = new Date().getFullYear();

export const startupSchema = z.object({
  name: z.string().trim().min(2, "Enter the startup name").max(120),
  description: optionalText(5000),
  founding_year: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= currentYear), `Enter a year between 1900 and ${currentYear}`)
    .transform((value) => (value === "" ? null : Number(value))),
  stage: z.enum(Constants.startup_stage, { message: "Choose a stage" }),
  sector_id: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Choose a sector")
    .transform((value) => (value === "" ? null : Number(value))),
  domain: optionalText(120),
  offering_type: z
    .union([z.enum(Constants.offering_type), z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  product_or_service: optionalText(2000),
  target_customers: optionalText(2000),
  district: optionalText(60),
  city: optionalText(80),
  legal_status: z.enum(Constants.legal_status, { message: "Choose a legal status" }),
  registration_number: optionalText(50),
  dpiit_recognised: z.boolean(),
  website: optionalUrl,
});

export const memberSchema = z.object({
  full_name: z.string().trim().min(1, "Enter the person's name").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || z.string().email().safeParse(value).success, "Enter a valid email address"),
  role_title: optionalText(80),
  is_founder: z.boolean(),
  linkedin_url: optionalUrl,
});

export const financialsSchema = z
  .object({
    as_of_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
      .refine((value) => value <= new Date().toISOString().slice(0, 10), "The date can't be in the future"),
    annual_revenue: optionalMoney,
    monthly_operating_expenses: optionalMoney,
    cash_balance: optionalMoney,
    total_funding_received: optionalMoney,
    monthly_burn_rate: optionalMoney,
  })
  .refine(
    (data) =>
      [data.annual_revenue, data.monthly_operating_expenses, data.cash_balance, data.total_funding_received, data.monthly_burn_rate].some(
        (value) => value !== null,
      ),
    { message: "Fill in at least one figure", path: ["annual_revenue"] },
  );

export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
