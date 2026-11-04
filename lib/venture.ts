import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Step } from "@/lib/venture-steps";

// Everything about the signed-in founder's venture, for the profile pages.
export async function loadVenture(supabase: SupabaseClient<Database>, userId: string) {
  const [{ data: profile }, { data: founder }, { data: startup }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("founder_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("startups")
      .select("*, startup_stages(name), startup_sectors(sector_id), startup_support_needs(support_need_id), startup_members(id, full_name, role_title, is_founder, linkedin_url, created_at)")
      .eq("owner_id", userId)
      .maybeSingle(),
  ]);

  const gaps = startup ? ((await supabase.rpc("startup_profile_gaps", { p_startup_id: startup.id })).data ?? []) : null;

  const blank = (value: string | null | undefined) => !value || !value.trim();
  const stepDone: Record<Step, boolean> = {
    founder: !blank(profile?.full_name) && !blank(founder?.phone) && !blank(founder?.district) && Boolean(founder?.domicile_declared) && Boolean(founder?.consent_given),
    basics: Boolean(startup) && !blank(startup?.description) && Boolean(startup?.stage_id) && (startup?.startup_sectors.length ?? 0) > 0,
    problem: Boolean(startup) && !blank(startup?.problem) && !blank(startup?.solution) && !blank(startup?.target_customers),
    traction: Boolean(startup && (startup.traction_level || startup.traction_summary || startup.website)),
    support: (startup?.startup_support_needs.length ?? 0) > 0,
  };

  return { profile, founder, startup, gaps, stepDone };
}
