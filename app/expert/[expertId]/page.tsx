import type { Metadata } from "next";
import Link from "next/link";
import { updateExpert } from "@/app/actions/experts";
import { ExpertForm } from "@/components/experts/expert-form";
import { SlotManager } from "@/components/experts/slot-manager";
import { Notice } from "@/components/notice";
import { requireLinkedExpert } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile and availability" };

export default async function ExpertProfilePage({ params, searchParams }: { params: Promise<{ expertId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { expertId } = await params;
  const { notice, error } = await searchParams;
  const path = `/expert/${expertId}`;
  const { supabase } = await requireLinkedExpert(expertId, path);
  const [{ data: expert }, { data: slots }] = await Promise.all([
    supabase.from("center_experts").select("*, incubation_centers(name, slug)").eq("id", expertId).single(),
    supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, is_cancelled, consultation_bookings!consultation_bookings_slot_id_fkey(id, status)")
      .eq("expert_id", expertId)
      .eq("is_cancelled", false)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(100),
  ]);
  if (!expert) return null;

  return (
    <>
      <Notice code={notice} error={error} />
      <h1>{expert.full_name}</h1>
      <p className="muted">
        At {expert.incubation_centers?.name}. <Link href={`/experts/${expert.id}`}>View your public profile</Link>
      </p>
      {!expert.is_active ? (
        <p className="alert alert-info">Your profile is inactive, so founders can&apos;t see it. Ask the centre&apos;s staff to activate it.</p>
      ) : null}
      <SlotManager expertId={expert.id} returnPath={path} slots={slots ?? []} sessionMinutes={expert.session_minutes} bookingBasePath="/expert/bookings" />
      <details className="card">
        <summary>Edit profile, policy, format and fee</summary>
        <ExpertForm action={updateExpert.bind(null, expert.id, path)} expert={expert} />
      </details>
    </>
  );
}
