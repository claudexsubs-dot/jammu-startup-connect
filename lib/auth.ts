import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CenterStatus, Enum } from "@/lib/types";

export type StaffCentre = { id: string; slug: string; name: string; status: CenterStatus };
export type LinkedExpert = { id: string; full_name: string; center_id: string; center_name: string; center_slug: string };

// Everything the app needs to know about the signed-in person, loaded once per request.
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, roles: [] as Enum<"platform_role">[], staffCentres: [] as StaffCentre[], experts: [] as LinkedExpert[] };
  }

  const [{ data: profile }, { data: roles }, { data: memberships }, { data: experts }] = await Promise.all([
    supabase.from("profiles").select("full_name, is_suspended, suspension_reason").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("center_staff_memberships")
      .select("incubation_centers(id, slug, name, status)")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase.from("center_experts").select("id, full_name, center_id, incubation_centers(slug, name)").eq("user_id", user.id),
  ]);

  const staffCentres = (memberships ?? []).flatMap((m) => (m.incubation_centers && m.incubation_centers.status !== "archived" ? [m.incubation_centers] : []));
  const linkedExperts = (experts ?? []).map((e) => ({
    id: e.id,
    full_name: e.full_name,
    center_id: e.center_id,
    center_name: e.incubation_centers?.name ?? "",
    center_slug: e.incubation_centers?.slug ?? "",
  }));

  return {
    supabase,
    user,
    profile,
    roles: (roles ?? []).map((r) => r.role),
    staffCentres,
    experts: linkedExperts,
  };
});

export type Viewer = Awaited<ReturnType<typeof getViewer>>;

// Returns the signed-in person, or sends the visitor to the login page.
export async function requireUser(next?: string) {
  const viewer = await getViewer();
  if (!viewer.user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  if (viewer.profile?.is_suspended) redirect("/suspended");
  return { ...viewer, user: viewer.user };
}

// Records the attempt, then shows a plain "no access" page.
export async function denyAccess(path: string): Promise<never> {
  const { supabase, user } = await getViewer();
  if (user) await supabase.rpc("log_access_denied", { p_path: path });
  redirect("/forbidden");
}

export async function requireAdmin(path: string) {
  const viewer = await requireUser(path);
  if (!viewer.roles.includes("platform_admin")) await denyAccess(path);
  return viewer;
}

export async function requireCentreStaff(slug: string, path: string) {
  const viewer = await requireUser(path);
  const centre = viewer.staffCentres.find((c) => c.slug === slug);
  if (!centre) return denyAccess(path);
  return { ...viewer, centre };
}

export async function requireLinkedExpert(expertId: string, path: string) {
  const viewer = await requireUser(path);
  const expert = viewer.experts.find((e) => e.id === expertId);
  if (!expert) return denyAccess(path);
  return { ...viewer, expert };
}

// Only allow redirects to paths on this site.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
