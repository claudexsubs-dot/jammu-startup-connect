import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

// Loads a startup the signed-in person may edit, or shows "not found".
// The database's security rules make the final decision; this only picks the right page.
export async function loadEditableStartup(id: string, path: string) {
  const { supabase, user } = await requireUser(path);
  const [{ data: startup }, { data: membership }] = await Promise.all([
    supabase.from("startups").select("*").eq("id", id).maybeSingle(),
    supabase.from("startup_members").select("access").eq("startup_id", id).eq("user_id", user.id).maybeSingle(),
  ]);

  const access = membership?.access;
  if (!startup || (access !== "owner" && access !== "editor")) notFound();
  return { supabase, user, startup, isOwner: access === "owner" };
}
