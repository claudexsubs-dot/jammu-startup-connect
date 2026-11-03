import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteStartup, updateStartup } from "@/app/actions/startups";
import { ConfirmButton } from "@/components/confirm-button";
import { ManageNav } from "@/components/startups/manage-nav";
import { StartupForm } from "@/components/startups/startup-form";
import { isUuid } from "@/lib/ids";
import { loadEditableStartup } from "../load";

export const metadata: Metadata = { title: "Edit startup" };

export default async function EditStartupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, startup, isOwner } = await loadEditableStartup(id, `/startups/${id}/edit`);
  const { data: sectors } = await supabase.from("sectors").select("id, name").order("name");

  return (
    <section className="narrow">
      <ManageNav startupId={id} current="edit" />
      <h1>Edit {startup.name}</h1>
      <StartupForm action={updateStartup.bind(null, id)} sectors={sectors ?? []} startup={startup} submitLabel="Save changes" />

      {isOwner ? (
        <section className="danger-zone">
          <h2>Delete this startup</h2>
          <p>This removes the profile, team list and all financial reports. It can&apos;t be undone.</p>
          <form action={deleteStartup.bind(null, id)}>
            <ConfirmButton message={`Delete ${startup.name} and all its data? This can't be undone.`}>Delete startup</ConfirmButton>
          </form>
        </section>
      ) : null}
    </section>
  );
}
