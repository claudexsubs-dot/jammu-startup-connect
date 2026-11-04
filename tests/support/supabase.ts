import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types";

// These tests talk to a LOCAL Supabase stack (`supabase start`) and create throwaway
// accounts. They refuse to run against a hosted project.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const IS_LOCAL = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(SUPABASE_URL) && SUPABASE_KEY !== "";
export const DEMO_PASSWORD = "Udyam-local-123";

export type Client = SupabaseClient<Database>;

export function anonClient(): Client {
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function signIn(email: string, password = DEMO_PASSWORD) {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Couldn't sign in ${email}: ${error?.message}`);
  return { client, userId: data.user.id, email };
}

export const unique = (label: string) => `${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function signUp(email: string, meta: Record<string, string>) {
  const client = anonClient();
  const { data, error } = await client.auth.signUp({ email, password: DEMO_PASSWORD, options: { data: meta } });
  if (error || !data.user || !data.session) throw new Error(`Couldn't create ${email}: ${error?.message ?? "no session (are email confirmations off locally?)"}`);
  return { client, userId: data.user.id, email };
}

export async function taxonomyIds(client: Client) {
  const [{ data: stages }, { data: sectors }, { data: needs }] = await Promise.all([
    client.from("startup_stages").select("id, code"),
    client.from("sectors").select("id, slug"),
    client.from("support_needs").select("id, slug"),
  ]);
  const pick = <T extends { id: number }>(rows: T[] | null, key: keyof T, value: string) => {
    const row = (rows ?? []).find((r) => r[key] === value);
    if (!row) throw new Error(`Missing taxonomy value ${value}. Did the migration run?`);
    return row.id;
  };
  return {
    earlyStage: pick(stages, "code", "early_stage"),
    ideation: pick(stages, "code", "ideation"),
    agri: pick(sectors, "slug", "agriculture-food-processing"),
    software: pick(sectors, "slug", "it-software"),
    mentorship: pick(needs, "slug", "mentorship"),
    marketAccess: pick(needs, "slug", "market-access"),
  };
}

export type Ids = Awaited<ReturnType<typeof taxonomyIds>>;

// A founder account. With `complete`, the venture profile has every required field.
export async function newFounder(ids: Ids, { complete = true, shareContact = false, name = "Test Founder" } = {}) {
  const email = `${unique("founder")}@udyamsetu.test`;
  const founder = await signUp(email, {
    full_name: name,
    account_type: "founder",
    phone: "9000000099",
    district: "Jammu",
    city: "Jammu",
    domicile_declared: "true",
    consent_given: "true",
  });
  if (shareContact) {
    const { error } = await founder.client.from("founder_profiles").update({ share_contact_with_centres: true }).eq("user_id", founder.userId);
    if (error) throw error;
  }
  const { data: startup, error } = await founder.client
    .from("startups")
    .insert(
      complete
        ? {
            owner_id: founder.userId,
            name: `${name}'s venture`,
            description: "Cold storage for small orchards.",
            stage_id: ids.earlyStage,
            problem: "Fruit spoils before it reaches market.",
            solution: "Shared solar cold rooms.",
            target_customers: "Orchard owners in Jammu division.",
            district: "Jammu",
          }
        : { owner_id: founder.userId, name: `${name}'s idea`, description: "Still working it out." },
    )
    .select("id")
    .single();
  if (error || !startup) throw error ?? new Error("startup insert failed");
  if (complete) {
    const sectorInsert = await founder.client.from("startup_sectors").insert({ startup_id: startup.id, sector_id: ids.agri });
    const needInsert = await founder.client.from("startup_support_needs").insert({ startup_id: startup.id, support_need_id: ids.mentorship });
    if (sectorInsert.error || needInsert.error) throw sectorInsert.error ?? needInsert.error;
  }
  return { ...founder, startupId: startup.id };
}

// An account created from an invitation (centre staff or expert).
export async function newInvitee(label: string) {
  return signUp(`${unique(label)}@udyamsetu.test`, { full_name: `Test ${label}`, account_type: "invitee" });
}

// A fresh, real (non-sample) centre created by the master admin, with one staff member.
export async function newCentre(admin: Client, ids: Ids, label = "Test Centre") {
  const slug = unique("test-centre");
  const { data: centre, error } = await admin
    .from("incubation_centers")
    .insert({ slug, name: `${label} ${slug.slice(-5)}`, district: "Jammu", city: "Jammu", accepting_applications: true })
    .select("id, slug, name")
    .single();
  if (error || !centre) throw error ?? new Error("centre insert failed");
  await admin.from("center_stages").insert({ center_id: centre.id, stage_id: ids.earlyStage });
  await admin.from("center_sectors").insert({ center_id: centre.id, sector_id: ids.agri });
  await admin.from("center_services").insert({ center_id: centre.id, support_need_id: ids.mentorship });

  const staff = await newInvitee("staff");
  const { data: token, error: inviteError } = await admin.rpc("admin_invite_staff", { p_center_id: centre.id, p_email: staff.email });
  if (inviteError || !token) throw inviteError ?? new Error("invite failed");
  const { error: acceptError } = await staff.client.rpc("accept_invitation", { p_token: token });
  if (acceptError) throw acceptError;
  return { centre, staff };
}

// A future slot a few days out, at a time unique to this run.
export function futureSlot(dayOffset: number, minutes = 45) {
  const start = new Date(Date.now() + dayOffset * 86_400_000);
  start.setUTCSeconds(0, 0);
  return { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + minutes * 60_000).toISOString() };
}
