import type { Metadata } from "next";
import { createStartup } from "@/app/actions/startups";
import { StartupForm } from "@/components/startups/startup-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Add a startup" };

export default async function NewStartupPage() {
  const { supabase } = await requireUser("/startups/new");
  const { data: sectors } = await supabase.from("sectors").select("id, name").order("name");

  return (
    <section className="narrow">
      <h1>Add your startup</h1>
      <p className="muted">Only the name, stage and legal status are required. Your profile stays private until you publish it.</p>
      <StartupForm action={createStartup} sectors={sectors ?? []} submitLabel="Create startup profile" />
    </section>
  );
}
