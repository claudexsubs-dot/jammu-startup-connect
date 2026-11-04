import { expect, test } from "@playwright/test";
import {
  IS_LOCAL,
  anonClient,
  futureSlot,
  newCentre,
  newFounder,
  signIn,
  taxonomyIds,
  type Client,
  type Ids,
} from "../support/supabase";

// Role permissions and the core workflows, checked directly against the database API
// with real accounts, exactly as the website calls it.
test.skip(!IS_LOCAL, "Needs the local Supabase stack (supabase start) and its URL and publishable key in the environment.");
test.describe.configure({ mode: "serial" });

let ids: Ids;
let admin: Awaited<ReturnType<typeof signIn>>;
let otherStaff: Awaited<ReturnType<typeof signIn>>;
let centre: Awaited<ReturnType<typeof newCentre>>["centre"];
let staff: Awaited<ReturnType<typeof newCentre>>["staff"];
let founderA: Awaited<ReturnType<typeof newFounder>>;
let founderB: Awaited<ReturnType<typeof newFounder>>;
let applicationId: string;

test.beforeAll(async () => {
  admin = await signIn("admin@udyamsetu.local");
  otherStaff = await signIn("staff@udyamsetu.local");
  ids = await taxonomyIds(admin.client);
  ({ centre, staff } = await newCentre(admin.client, ids));
  founderA = await newFounder(ids, { name: "Asha" });
  founderB = await newFounder(ids, { name: "Bilal", shareContact: true });
});

async function expectError(promise: PromiseLike<{ error: { message: string; code?: string } | null }>, message: string) {
  const { error } = await promise;
  expect(error, `expected the database to refuse with ${message}`).not.toBeNull();
  expect(error?.message).toBe(message);
}

test("signed-out visitors see active centres but no startups, applications or founder details", async () => {
  const anon = anonClient();
  const { data: centres } = await anon.from("incubation_centers").select("id, status");
  expect(centres?.length).toBeGreaterThan(0);
  expect(centres?.every((c) => c.status === "active")).toBe(true);
  for (const table of ["startups", "founder_profiles", "startup_applications", "startup_financials", "consultation_bookings", "message_threads"] as const) {
    const { data } = await anon.from(table).select("*").limit(1);
    expect(data ?? [], `${table} must not be readable without signing in`).toHaveLength(0);
  }
  const { error } = await anon.rpc("start_application", { p_center_id: centre.id });
  expect(error).not.toBeNull();
});

test("founders can't see each other's startups, contact details or financials", async () => {
  const { error: finError } = await founderA.client
    .from("startup_financials")
    .insert({ startup_id: founderA.startupId, as_of_date: "2026-03-31", annual_revenue: 500000, created_by: founderA.userId });
  expect(finError).toBeNull();

  const { data: startups } = await founderB.client.from("startups").select("id").eq("id", founderA.startupId);
  expect(startups).toHaveLength(0);
  const { data: financials } = await founderB.client.from("startup_financials").select("id").eq("startup_id", founderA.startupId);
  expect(financials).toHaveLength(0);
  const { data: profiles } = await founderB.client.from("founder_profiles").select("user_id");
  expect(profiles?.map((p) => p.user_id)).toEqual([founderB.userId]);
});

test("centre staff can browse every startup but see contact details only when shared, and never private financials", async () => {
  const { data: startups } = await staff.client.from("startups").select("id").in("id", [founderA.startupId, founderB.startupId]);
  expect(startups).toHaveLength(2);

  const { data: financials } = await staff.client.from("startup_financials").select("id").eq("startup_id", founderA.startupId);
  expect(financials).toHaveLength(0);
  const { data: founderProfiles } = await staff.client.from("founder_profiles").select("user_id");
  expect(founderProfiles).toHaveLength(0);

  const { data: hidden } = await staff.client.rpc("startup_contact", { p_startup_id: founderA.startupId });
  expect(hidden?.[0]).toMatchObject({ shared: false, email: null, phone: null });
  const { data: shared } = await staff.client.rpc("startup_contact", { p_startup_id: founderB.startupId });
  expect(shared?.[0]).toMatchObject({ shared: true, email: founderB.email, phone: "9000000099" });

  const { data: memberContacts } = await staff.client.from("startup_member_contacts").select("member_id");
  expect(memberContacts).toHaveLength(0);
});

test("an incomplete profile is kept as a draft and the founder is told what is missing", async () => {
  const draftFounder = await newFounder(ids, { complete: false, name: "Chetan" });
  const { data: draftId, error } = await draftFounder.client.rpc("start_application", { p_center_id: centre.id });
  expect(error).toBeNull();
  const { error: submitError } = await draftFounder.client.rpc("submit_application", { p_application_id: draftId! });
  expect(submitError?.message).toBe("profile_incomplete");
  expect(submitError?.details).toContain("Startup stage");
  expect(submitError?.details).toContain("At least one sector");
  const { data: app } = await draftFounder.client.from("startup_applications").select("status").eq("id", draftId!).single();
  expect(app?.status).toBe("draft");
  // Centre staff never see drafts.
  const { data: seen } = await staff.client.from("startup_applications").select("id").eq("id", draftId!);
  expect(seen).toHaveLength(0);
});

test("a founder has one application per centre: starting again resumes it, and the submission stores a snapshot", async () => {
  const { data: first } = await founderA.client.rpc("start_application", { p_center_id: centre.id });
  const { data: again } = await founderA.client.rpc("start_application", { p_center_id: centre.id });
  expect(first).toBeTruthy();
  expect(again).toBe(first);
  applicationId = first!;

  // Applications are only created through the workflow functions, never written directly.
  const { error: directInsert } = await founderA.client.from("startup_applications").insert({ startup_id: founderA.startupId, center_id: centre.id, founder_id: founderA.userId });
  expect(directInsert).not.toBeNull();

  const { error } = await founderA.client.rpc("submit_application", { p_application_id: applicationId });
  expect(error).toBeNull();
  await expectError(founderA.client.rpc("submit_application", { p_application_id: applicationId }), "already_submitted");

  const { data: app } = await staff.client.from("startup_applications").select("status, profile_snapshot").eq("id", applicationId).single();
  expect(app?.status).toBe("submitted");
  const snapshot = app?.profile_snapshot as { startup: { name: string }; founder: { contact: unknown }; financials: unknown };
  expect(snapshot.startup.name).toBe("Asha's venture");
  expect(snapshot.founder.contact).toBeNull();
  expect(snapshot.financials).toBeNull();
});

test("only the receiving centre sees an application, and only its staff can change the status", async () => {
  const { data: elsewhere } = await otherStaff.client.from("startup_applications").select("id").eq("id", applicationId);
  expect(elsewhere).toHaveLength(0);
  await expectError(otherStaff.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "accepted" }), "not_allowed");
  await expectError(founderA.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "accepted" }), "not_allowed");

  await expectError(staff.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "more_information_needed" }), "note_required");
  expect(
    (await staff.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "more_information_needed", p_note: "Please share pilot numbers." })).error,
  ).toBeNull();

  const { error: replyError } = await founderA.client.rpc("respond_to_information_request", { p_application_id: applicationId, p_response: "40 growers, 2 routes." });
  expect(replyError).toBeNull();
  const { data: afterReply } = await founderA.client.from("startup_applications").select("status, founder_response").eq("id", applicationId).single();
  expect(afterReply).toMatchObject({ status: "under_review", founder_response: "40 growers, 2 routes." });

  expect((await staff.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "accepted", p_note: "Welcome!" })).error).toBeNull();
  await expectError(staff.client.rpc("change_application_status", { p_application_id: applicationId, p_status: "under_review" }), "invalid_transition");

  const { data: history } = await founderA.client.from("application_status_history").select("to_status").eq("application_id", applicationId).order("created_at");
  expect(history?.map((h) => h.to_status)).toEqual(["submitted", "more_information_needed", "under_review", "accepted"]);
  const { data: notes } = await founderA.client.from("notifications").select("title");
  expect(notes?.some((n) => n.title.includes("accepted your application"))).toBe(true);
});

test("a centre can message any startup; the founder replies; nobody else can read it", async () => {
  const { data: threadId, error } = await staff.client.rpc("start_thread", {
    p_center_id: centre.id,
    p_startup_id: founderB.startupId,
    p_subject: "Interested in your venture",
    p_body: "Would you like to apply?",
  });
  expect(error).toBeNull();
  expect((await founderB.client.rpc("send_message", { p_thread_id: threadId!, p_body: "Yes, thank you." })).error).toBeNull();

  const { data: messages } = await founderB.client.from("messages").select("sender_side, body").eq("thread_id", threadId!).order("created_at");
  expect(messages?.map((m) => m.sender_side)).toEqual(["center", "founder"]);
  const { data: outsider } = await founderA.client.from("messages").select("id").eq("thread_id", threadId!);
  expect(outsider).toHaveLength(0);
  const { data: otherCentre } = await otherStaff.client.from("message_threads").select("id").eq("id", threadId!);
  expect(otherCentre).toHaveLength(0);

  // Founders start conversations only about an application they have submitted.
  await expectError(
    founderB.client.rpc("start_thread", { p_center_id: centre.id, p_startup_id: founderB.startupId, p_subject: "Hi", p_body: "Hello" }),
    "founder_needs_application",
  );
  expect((await founderB.client.rpc("report_thread", { p_thread_id: threadId!, p_reason: "Testing the report button" })).error).toBeNull();
  const { data: reports } = await admin.client.from("reports").select("id").eq("thread_id", threadId!);
  expect(reports).toHaveLength(1);
});

test("a booking stays pending until the expert confirms, takes no payment, and a slot can't be double-booked", async () => {
  const { data: expert, error } = await staff.client
    .from("center_experts")
    .insert({ center_id: centre.id, full_name: "Dr. Test Expert", engagement_policy: "both", is_paid: true, fee_inr: 1500, session_minutes: 45, offers_online: true, offers_in_person: false })
    .select("id")
    .single();
  expect(error).toBeNull();
  const { data: slots } = await staff.client
    .from("availability_slots")
    .insert([{ expert_id: expert!.id, ...futureSlot(3) }, { expert_id: expert!.id, ...futureSlot(4) }])
    .select("id");
  const [slot, spare] = slots!;

  const { data: bookingId, error: requestError } = await founderA.client.rpc("request_booking", { p_slot_id: slot.id, p_format: "online", p_note: "Pricing advice" });
  expect(requestError).toBeNull();
  await expectError(founderB.client.rpc("request_booking", { p_slot_id: slot.id, p_format: "online" }), "slot_unavailable");
  await expectError(founderB.client.rpc("request_booking", { p_slot_id: spare.id, p_format: "in_person" }), "format_not_offered");

  const { data: open } = await founderB.client.rpc("available_slots", { p_expert_id: expert!.id });
  expect(open?.map((s) => s.id)).toEqual([spare.id]);

  const { data: pending } = await founderA.client.from("consultation_bookings").select("status, meeting_link").eq("id", bookingId!).single();
  expect(pending).toEqual({ status: "pending", meeting_link: null });

  // The founder can't confirm their own booking; another centre can't touch it.
  await expectError(founderA.client.rpc("update_booking", { p_booking_id: bookingId!, p_action: "confirm", p_meeting_link: "https://meet.example.com/x" }), "not_allowed");
  await expectError(otherStaff.client.rpc("update_booking", { p_booking_id: bookingId!, p_action: "decline" }), "not_allowed");

  await expectError(staff.client.rpc("update_booking", { p_booking_id: bookingId!, p_action: "confirm" }), "meeting_link_required");
  expect((await staff.client.rpc("update_booking", { p_booking_id: bookingId!, p_action: "send_payment_instructions", p_payment_instructions: "Pay at the centre office." })).error).toBeNull();
  expect((await staff.client.rpc("update_booking", { p_booking_id: bookingId!, p_action: "confirm", p_meeting_link: "https://meet.example.com/abc" })).error).toBeNull();

  const { data: confirmed } = await founderA.client.from("consultation_bookings").select("status, meeting_link, payment_instructions").eq("id", bookingId!).single();
  expect(confirmed).toEqual({ status: "confirmed", meeting_link: "https://meet.example.com/abc", payment_instructions: "Pay at the centre office." });
  const { data: events } = await founderA.client.from("booking_events").select("to_status").eq("booking_id", bookingId!).order("created_at");
  expect(events?.map((e) => e.to_status)).toEqual(["pending", "payment_instructions_sent", "confirmed"]);

  // A slot holding a live booking can't be removed.
  const { error: removeError } = await staff.client.from("availability_slots").delete().eq("id", slot.id);
  expect(removeError).not.toBeNull();

  // The founder can cancel; the time opens up again.
  expect((await founderA.client.rpc("founder_update_booking", { p_booking_id: bookingId!, p_action: "cancel" })).error).toBeNull();
  const { data: reopened } = await founderB.client.rpc("available_slots", { p_expert_id: expert!.id });
  expect(reopened?.map((s) => s.id).sort()).toEqual([slot.id, spare.id].sort());
});

test("engagement policies decide who can request a session", async () => {
  const { data: expert } = await staff.client
    .from("center_experts")
    .insert({ center_id: centre.id, full_name: "Admitted-only Mentor", engagement_policy: "admitted_only", is_paid: false, session_minutes: 30, offers_online: true, offers_in_person: false })
    .select("id")
    .single();
  const { data: slots } = await staff.client.from("availability_slots").insert({ expert_id: expert!.id, ...futureSlot(5, 30) }).select("id");

  const { data: reasonB } = await founderB.client.rpc("booking_eligibility", { p_expert_id: expert!.id });
  expect(reasonB).toBe("policy_admitted_only");
  await expectError(founderB.client.rpc("request_booking", { p_slot_id: slots![0].id, p_format: "online" }), "policy_admitted_only");

  // Founder A was accepted by this centre earlier, so may book.
  const { data: reasonA } = await founderA.client.rpc("booking_eligibility", { p_expert_id: expert!.id });
  expect(reasonA).toBeNull();
});

test("a linked expert sees the startup behind their own requests, but not other bookings or startups", async () => {
  const expert = await signIn("expert@udyamsetu.local");
  const { data: profile } = await expert.client.from("center_experts").select("id").eq("user_id", expert.userId).single();
  const { data: open } = await founderB.client.rpc("available_slots", { p_expert_id: profile!.id });
  expect(open?.length).toBeGreaterThan(0);
  const { data: bookingId, error } = await founderB.client.rpc("request_booking", { p_slot_id: open![0].id, p_format: "online" });
  expect(error).toBeNull();
  try {
    const { data: seen } = await expert.client.from("consultation_bookings").select("status, startups(name)").eq("id", bookingId!).single();
    expect(seen).toEqual({ status: "pending", startups: { name: "Bilal's venture" } });
    const { data: otherBookings } = await expert.client.from("consultation_bookings").select("id").eq("center_id", centre.id);
    expect(otherBookings).toHaveLength(0);
    const { data: browse } = await expert.client.from("startups").select("id").eq("id", founderA.startupId);
    expect(browse).toHaveLength(0);
    // Experts can't switch their own profile on or off; that's for centre staff.
    await expectError(expert.client.from("center_experts").update({ is_active: false }).eq("id", profile!.id), "staff_only_fields");
  } finally {
    await founderB.client.rpc("founder_update_booking", { p_booking_id: bookingId!, p_action: "cancel" });
  }
});

test("centre staff can't change admin-only fields such as the centre's status", async () => {
  await expectError(staff.client.from("incubation_centers").update({ status: "suspended" }).eq("id", centre.id), "admin_only_fields");
  // Where a listing comes from is set by the master admin only.
  await expectError(staff.client.from("incubation_centers").update({ source_label: "Our own claim" }).eq("id", centre.id), "admin_only_fields");
  const { error } = await staff.client.from("incubation_centers").update({ short_description: "Updated by staff" }).eq("id", centre.id);
  expect(error).toBeNull();
  // Staff of another centre can't edit this one at all.
  const { data: changed } = await otherStaff.client.from("incubation_centers").update({ short_description: "Hijacked" }).eq("id", centre.id).select("id");
  expect(changed ?? []).toHaveLength(0);
});

test("a suspended centre keeps its history but takes no new applications or conversations", async () => {
  expect((await admin.client.from("incubation_centers").update({ status: "suspended", status_reason: "Test suspension" }).eq("id", centre.id)).error).toBeNull();
  try {
    await expectError(founderB.client.rpc("start_application", { p_center_id: centre.id }), "centre_suspended");
    await expectError(
      staff.client.rpc("start_thread", { p_center_id: centre.id, p_startup_id: founderA.startupId, p_subject: "Hello", p_body: "Hi" }),
      "centre_suspended",
    );
    const { data: history } = await founderA.client.from("startup_applications").select("status").eq("id", applicationId).single();
    expect(history?.status).toBe("accepted");
    const { data: publicView } = await anonClient().from("incubation_centers").select("id").eq("id", centre.id);
    expect(publicView).toHaveLength(0);
  } finally {
    await admin.client.from("incubation_centers").update({ status: "active", status_reason: null }).eq("id", centre.id);
  }
  const { data: audit } = await admin.client.from("audit_logs").select("action").eq("entity_id", centre.id).like("action", "center.%");
  expect(audit?.map((a) => a.action)).toEqual(expect.arrayContaining(["center.created", "center.suspended", "center.activated"]));
});

test("a suspended account can't make changes", async () => {
  const founderC = await newFounder(ids, { name: "Deepa" });
  expect((await admin.client.rpc("admin_set_user_suspension", { p_user_id: founderC.userId, p_suspended: true, p_reason: "Test suspension" })).error).toBeNull();
  await expectError(founderC.client.rpc("start_application", { p_center_id: centre.id }), "account_suspended");
  const { data: updated } = await founderC.client.from("startups").update({ name: "Changed" }).eq("id", founderC.startupId).select("id");
  expect(updated ?? []).toHaveLength(0);
  await expectError(admin.client.rpc("admin_set_user_suspension", { p_user_id: admin.userId, p_suspended: true, p_reason: "Oops oops" }), "cannot_suspend_self");
});

test("only the master admin sees platform counts and the audit log, and blocked access is recorded", async () => {
  await expectError(founderA.client.rpc("admin_platform_stats"), "not_allowed");
  await expectError(staff.client.rpc("admin_list_users", {}), "not_allowed");
  const { data: staffAudit } = await staff.client.from("audit_logs").select("id").limit(1);
  expect(staffAudit).toHaveLength(0);
  await expectError(staff.client.rpc("admin_invite_staff", { p_center_id: centre.id, p_email: "someone@example.com" }), "not_allowed");

  expect((await founderA.client.rpc("log_access_denied", { p_path: "/admin" })).error).toBeNull();
  const { data: denied } = await admin.client.from("audit_logs").select("actor_id, entity_id").eq("action", "access.denied").eq("actor_id", founderA.userId);
  expect(denied?.[0]?.entity_id).toBe("/admin");

  const { data: stats } = await admin.client.rpc("admin_platform_stats");
  expect(stats).toMatchObject({ users: expect.any(Number), startups: expect.any(Number) });
  const { data: users } = await admin.client.rpc("admin_list_users", { p_search: "Asha" });
  expect(users?.[0]?.masked_email).toMatch(/^f\*\*\*@udyamsetu\.test$/);
});

test("roles can't be granted through the API", async () => {
  const { error } = await founderA.client.from("user_roles").insert({ user_id: founderA.userId, role: "platform_admin" });
  expect(error).not.toBeNull();
  const { error: rpcError } = await founderA.client.rpc("grant_platform_admin" as never, { p_email: founderA.email } as never);
  expect(rpcError).not.toBeNull();
  const { error: profileError } = await founderA.client.from("profiles").update({ is_suspended: false }).eq("id", founderA.userId);
  expect(profileError).not.toBeNull();
});

test("visitors can see open times and the expert directory, but not who booked what", async () => {
  const anon = anonClient();
  const { data: directory, error } = await anon.rpc("expert_directory");
  expect(error).toBeNull();
  expect((directory ?? []).length).toBeGreaterThan(0);
  const withSlots = (directory ?? []).find((e) => e.next_slot_at);
  expect(withSlots).toBeTruthy();
  const { data: slots, error: slotError } = await anon.rpc("available_slots", { p_expert_id: withSlots!.id });
  expect(slotError).toBeNull();
  expect(Object.keys(slots?.[0] ?? {}).sort()).toEqual(["ends_at", "id", "starts_at"]);
  // Raw slot and booking tables stay closed to visitors.
  const { data: rawSlots } = await anon.from("availability_slots").select("id").limit(1);
  expect(rawSlots ?? []).toHaveLength(0);
  const { data: rawBookings } = await anon.from("consultation_bookings").select("id").limit(1);
  expect(rawBookings ?? []).toHaveLength(0);
  // Booking itself still needs an account.
  const { error: bookError } = await anon.rpc("request_booking", { p_slot_id: slots![0].id, p_format: "online" });
  expect(bookError).not.toBeNull();
});
