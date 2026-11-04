import type { SupabaseClient } from "@supabase/supabase-js";
import { checked, multiValues } from "@/app/actions/types";
import type { Database } from "@/lib/database.types";
import { centreProfileSchema } from "@/lib/validation";

const LINK_FIELDS = ["stage_ids", "sector_ids", "service_ids"];

export function readCentreForm(formData: FormData) {
  const multi = multiValues(formData, LINK_FIELDS);
  return {
    multi,
    parsed: centreProfileSchema.safeParse({
      name: formData.get("name") ?? "",
      short_description: formData.get("short_description") ?? "",
      description: formData.get("description") ?? "",
      host_institution: formData.get("host_institution") ?? "",
      district: formData.get("district") ?? "",
      city: formData.get("city") ?? "",
      address: formData.get("address") ?? "",
      website: formData.get("website") ?? "",
      public_email: formData.get("public_email") ?? "",
      application_guidance: formData.get("application_guidance") ?? "",
      accepting_applications: checked(formData, "accepting_applications"),
      applications_close_on: formData.get("applications_close_on") ?? "",
      stage_ids: multi.stage_ids,
      sector_ids: multi.sector_ids,
      service_ids: multi.service_ids,
    }),
  };
}

// Replaces the stages, sectors and services a centre supports.
export async function saveCentreLinks(
  supabase: SupabaseClient<Database>,
  centreId: string,
  links: { stage_ids: number[]; sector_ids: number[]; service_ids: number[] },
) {
  const steps = [
    ["center_stages", "stage_id", links.stage_ids],
    ["center_sectors", "sector_id", links.sector_ids],
    ["center_services", "support_need_id", links.service_ids],
  ] as const;
  for (const [table, column, ids] of steps) {
    const { error: deleteError } = await supabase.from(table).delete().eq("center_id", centreId);
    if (deleteError) return deleteError;
    if (ids.length) {
      const rows = [...new Set(ids)].map((id) => ({ center_id: centreId, [column]: id }));
      const { error } = await supabase.from(table).insert(rows as never);
      if (error) return error;
    }
  }
  return null;
}

