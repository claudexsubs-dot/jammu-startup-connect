import { z } from "zod";
import { Constants } from "@/lib/database.types";

const Enums = Constants.public.Enums;

// Empty form fields arrive as "", which we store as null.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => (value === "" ? null : value));

export const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max, `Must be ${max} characters or fewer`);

export const optionalUrl = z
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

const phone = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || /^\+?[0-9 ]{7,20}$/.test(value), "Enter a phone number using digits only");

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email,
  password: passwordSchema,
  phone,
  district: z.string().trim().min(1, "Choose your district").max(60),
  city: optionalText(80),
  domicile: z.literal(true, { errorMap: () => ({ message: "Confirm that you are domiciled in Jammu to register as a founder" }) }),
  consent: z.literal(true, { errorMap: () => ({ message: "Tick this box to continue" }) }),
});

export const inviteeRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email,
  password: passwordSchema,
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export const emailSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const founderDetailsSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone,
  district: optionalText(60),
  city: optionalText(80),
  domicile_declared: z.boolean(),
  consent_given: z.boolean(),
  share_contact_with_centres: z.boolean(),
});

const currentYear = new Date().getFullYear();

export const basicsSchema = z.object({
  name: z.string().trim().min(2, "Enter the startup name").max(120),
  description: optionalText(500),
  founding_year: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= currentYear), `Enter a year between 1900 and ${currentYear}`)
    .transform((value) => (value === "" ? null : Number(value))),
  stage_id: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Choose a stage")
    .transform((value) => (value === "" ? null : Number(value))),
  sector_ids: z.array(z.coerce.number().int().positive()).max(5, "Choose up to 5 sectors"),
  district: optionalText(60),
  city: optionalText(80),
  legal_status: z.enum(Enums.legal_status, { message: "Choose a legal status" }),
  registration_number: optionalText(50),
  dpiit_recognised: z.boolean(),
});

export const problemSchema = z.object({
  problem: optionalText(2000),
  solution: optionalText(2000),
  target_customers: optionalText(2000),
  offering_type: z.union([z.enum(Enums.offering_type), z.literal("")]).transform((value) => (value === "" ? null : value)),
  domain: optionalText(120),
});

export const tractionSchema = z.object({
  traction_level: z.union([z.enum(Enums.traction_level), z.literal("")]).transform((value) => (value === "" ? null : value)),
  traction_summary: optionalText(2000),
  website: optionalUrl,
  pitch_deck_url: optionalUrl,
  demo_url: optionalUrl,
});

export const supportSchema = z.object({
  support_need_ids: z.array(z.coerce.number().int().positive()).max(9),
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

export const centreProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the centre's name").max(150),
  short_description: optionalText(300),
  description: optionalText(5000),
  host_institution: optionalText(150),
  district: optionalText(60),
  city: optionalText(80),
  address: optionalText(300),
  website: optionalUrl,
  public_email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || z.string().email().safeParse(value).success, "Enter a valid email address"),
  application_guidance: optionalText(5000),
  accepting_applications: z.boolean(),
  applications_close_on: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a date")
    .transform((value) => (value === "" ? null : value)),
  stage_ids: z.array(z.coerce.number().int().positive()),
  sector_ids: z.array(z.coerce.number().int().positive()),
  service_ids: z.array(z.coerce.number().int().positive()),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, like tawi-innovation-hub")
  .max(80);

export const expertSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter the expert's name").max(120),
    headline: optionalText(150),
    organization: optionalText(150),
    bio: optionalText(3000),
    expertise_tags: z
      .string()
      .trim()
      .max(600)
      .transform((value) =>
        value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 15),
      ),
    engagement_policy: z.enum(Enums.engagement_policy, { message: "Choose who this person can support" }),
    is_paid: z.boolean(),
    fee_inr: z
      .string()
      .trim()
      .transform((value) => value.replace(/,/g, ""))
      .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1_000_000), "Enter a fee in rupees, like 1500")
      .transform((value) => (value === "" ? null : Number(value))),
    session_minutes: z.coerce.number().int().min(15, "At least 15 minutes").max(480, "At most 8 hours"),
    offers_online: z.boolean(),
    offers_in_person: z.boolean(),
    in_person_location: optionalText(300),
  })
  .refine((data) => data.offers_online || data.offers_in_person, { message: "Choose online, in person or both", path: ["offers_online"] })
  .refine((data) => !data.is_paid || data.fee_inr !== null, { message: "Paid sessions need a fee", path: ["fee_inr"] })
  .refine((data) => !data.offers_in_person || data.in_person_location !== null, {
    message: "Add where in-person sessions happen",
    path: ["in_person_location"],
  })
  .transform((data) => ({ ...data, fee_inr: data.is_paid ? data.fee_inr : null }));

export const taxonomySchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  description: optionalText(300),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export const inviteSchema = z.object({ email });

export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
