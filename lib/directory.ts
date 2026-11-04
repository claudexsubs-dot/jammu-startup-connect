import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type CentreSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  hostInstitution: string | null;
  district: string | null;
  city: string | null;
  isSample: boolean;
  acceptingApplications: boolean;
  applicationsCloseOn: string | null;
  openForApplications: boolean;
  stageIds: number[];
  sectorIds: number[];
  serviceIds: number[];
  expertCount: number;
  paidExpertCount: number;
};

export type DirectoryFilters = {
  q?: string;
  stage?: number;
  sector?: number;
  support?: number;
  district?: string;
  accepting?: boolean;
  experts?: boolean;
};

const CENTRE_SELECT =
  "id, slug, name, short_description, host_institution, district, city, is_sample, accepting_applications, applications_close_on, center_stages(stage_id), center_sectors(sector_id), center_services(support_need_id), center_experts(id, is_active, is_paid)";

function todayInIndia(now = new Date()) {
  return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

export function isOpenForApplications(accepting: boolean, closeOn: string | null, now = new Date()) {
  return accepting && (closeOn === null || closeOn >= todayInIndia(now));
}

// Active centres with what they support. Small enough to filter in the app.
export async function loadActiveCentres(supabase: SupabaseClient<Database>): Promise<CentreSummary[]> {
  const { data, error } = await supabase.from("incubation_centers").select(CENTRE_SELECT).eq("status", "active").order("name");
  if (error) throw new Error("centres_unavailable");
  return (data ?? []).map((c) => {
    const experts = (c.center_experts ?? []).filter((e) => e.is_active);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      shortDescription: c.short_description,
      hostInstitution: c.host_institution,
      district: c.district,
      city: c.city,
      isSample: c.is_sample,
      acceptingApplications: c.accepting_applications,
      applicationsCloseOn: c.applications_close_on,
      openForApplications: isOpenForApplications(c.accepting_applications, c.applications_close_on),
      stageIds: (c.center_stages ?? []).map((s) => s.stage_id),
      sectorIds: (c.center_sectors ?? []).map((s) => s.sector_id),
      serviceIds: (c.center_services ?? []).map((s) => s.support_need_id),
      expertCount: experts.length,
      paidExpertCount: experts.filter((e) => e.is_paid).length,
    };
  });
}

export function hasActiveFilters(filters: DirectoryFilters) {
  return Boolean(filters.q || filters.stage || filters.sector || filters.support || filters.district || filters.accepting || filters.experts);
}

export function filterCentres(centres: CentreSummary[], filters: DirectoryFilters) {
  const q = filters.q?.trim().toLowerCase();
  return centres.filter((c) => {
    if (q && !`${c.name} ${c.shortDescription ?? ""} ${c.hostInstitution ?? ""} ${c.city ?? ""}`.toLowerCase().includes(q)) return false;
    if (filters.stage && !c.stageIds.includes(filters.stage)) return false;
    if (filters.sector && !c.sectorIds.includes(filters.sector)) return false;
    if (filters.support && !c.serviceIds.includes(filters.support)) return false;
    if (filters.district && c.district !== filters.district) return false;
    if (filters.accepting && !c.openForApplications) return false;
    if (filters.experts && c.expertCount === 0) return false;
    return true;
  });
}

export function parseFilters(params: Record<string, string | string[] | undefined>): DirectoryFilters {
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const num = (key: string) => {
    const value = Number(one(key));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  return {
    q: one("q")?.slice(0, 80) || undefined,
    stage: num("stage"),
    sector: num("sector"),
    support: num("support"),
    district: one("district") || undefined,
    accepting: one("accepting") === "1",
    experts: one("experts") === "1",
  };
}
