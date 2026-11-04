import type { Metadata } from "next";
import Link from "next/link";
import { createCentre } from "@/app/actions/admin";
import { CentreProfileForm } from "@/components/centres/centre-profile-form";
import { Checkbox, Field } from "@/components/form";
import { requireAdmin } from "@/lib/auth";
import { loadTaxonomy } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Add a centre" };

export default async function NewCentrePage() {
  const { supabase } = await requireAdmin("/admin/centres/new");
  const taxonomy = await loadTaxonomy(supabase);
  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href="/admin/centres">Centres and staff</Link>
      </p>
      <h1>Add a centre</h1>
      <p className="muted">
        Only list a real organisation with its permission. Don&apos;t imply any official or government affiliation unless the centre has
        authorised it in writing.
      </p>
      <CentreProfileForm action={createCentre} centre={null} taxonomy={taxonomy} selected={{ stage_ids: [], sector_ids: [], service_ids: [] }} submitLabel="Create centre">
        <Field name="slug" label="Web address" hint="Lowercase letters, numbers and dashes. Leave blank to make one from the name. Can't be changed by centre staff." />
        <Checkbox name="is_sample" label="This is a sample (fictional) listing" hint="Sample listings are labelled on every page." />
      </CentreProfileForm>
    </section>
  );
}
