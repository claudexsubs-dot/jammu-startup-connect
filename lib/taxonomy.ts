import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Sector, Stage, SupportNeed } from "@/lib/types";

export type Taxonomy = { stages: Stage[]; sectors: Sector[]; needs: SupportNeed[] };

// Stages, sectors and support needs, managed by the master admin.
export async function loadTaxonomy(supabase: SupabaseClient<Database>, { includeInactive = false } = {}): Promise<Taxonomy> {
  const [stages, sectors, needs] = await Promise.all([
    supabase.from("startup_stages").select("*").order("sort_order").order("name"),
    supabase.from("sectors").select("*").order("sort_order").order("name"),
    supabase.from("support_needs").select("*").order("sort_order").order("name"),
  ]);
  const keep = <T extends { is_active: boolean }>(rows: T[] | null) => (rows ?? []).filter((row) => includeInactive || row.is_active);
  return { stages: keep(stages.data), sectors: keep(sectors.data), needs: keep(needs.data) };
}

export function nameById<T extends { id: number; name: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row.name]));
}

export function toOptions<T extends { id: number; name: string; description?: string | null }>(rows: T[]) {
  return rows.map((row) => ({ value: String(row.id), label: row.name, description: row.description ?? null }));
}
