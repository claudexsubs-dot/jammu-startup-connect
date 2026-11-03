"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { toFieldErrors } from "@/lib/validation";
import { formValues, type FormState } from "./types";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || /^\+?[0-9 ]{7,20}$/.test(value), "Enter a phone number using digits only"),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = profileSchema.safeParse({ full_name: formData.get("full_name") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase, user } = await requireUser("/account");
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "We couldn't save your details. Please try again.", values };

  revalidatePath("/", "layout");
  return { success: "Your details were saved." };
}
