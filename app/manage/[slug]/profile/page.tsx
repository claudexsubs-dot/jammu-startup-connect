import type { Metadata } from "next";
import { updateCentreProfile } from "@/app/actions/centres";
import { CentreProfileForm } from "@/components/centres/centre-profile-form";
import { requireCentreStaff } from "@/lib/auth";
import { loadTaxonomy } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Centre profile" };

export default async function ManageProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = `/manage/${slug}/profile`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  const [taxonomy, { data: row }] = await Promise.all([
    loadTaxonomy(supabase),
    supabase
      .from("incubation_centers")
      .select("*, center_stages(stage_id), center_sectors(sector_id), center_services(support_need_id)")
      .eq("id", centre.id)
      .single(),
  ]);

  return (
    <section className="narrow">
      <h2>Centre profile</h2>
      <p className="muted">This is what founders see on your public page and in the directory.</p>
      <CentreProfileForm
        action={updateCentreProfile.bind(null, centre.id, path)}
        centre={row}
        taxonomy={taxonomy}
        selected={{
          stage_ids: row?.center_stages.map((s) => s.stage_id) ?? [],
          sector_ids: row?.center_sectors.map((s) => s.sector_id) ?? [],
          service_ids: row?.center_services.map((s) => s.support_need_id) ?? [],
        }}
      />
    </section>
  );
}
