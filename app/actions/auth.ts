"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/auth";
import { emailSchema, loginSchema, newPasswordSchema, registerSchema, toFieldErrors } from "@/lib/validation";
import { formValues, type FormState } from "./types";

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["password"]);
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: friendlyAuthError(error.message), values };

  // With email confirmation on, Supabase returns no session until the link is clicked.
  if (!data.session) {
    return {
      success: `Almost done. We sent a confirmation link to ${parsed.data.email}. Open it to activate your account.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["password"]);
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyAuthError(error.message), values };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password`,
  });

  // Rate limits are the only error worth showing; otherwise we never reveal whether an account exists.
  if (error && error.status === 429) return { error: friendlyAuthError(error.message), values };

  return { success: "If an account exists for that email, a reset link is on its way. Check your inbox." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect("/dashboard?notice=password-updated");
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "That email and password don't match. Try again or reset your password.";
  if (lower.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (lower.includes("already registered")) return "An account with this email already exists. Try logging in.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (lower.includes("same as the old") || lower.includes("different from the old")) return "Choose a password you haven't used before.";
  if (lower.includes("weak") || lower.includes("pwned")) return "That password is too easy to guess. Choose a stronger one.";
  return "Something went wrong. Please try again.";
}
