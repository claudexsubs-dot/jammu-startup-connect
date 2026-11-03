import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user, or sends the visitor to the login page.
export async function requireUser(next?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return { supabase, user };
}

// Only allow redirects to paths on this site.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
