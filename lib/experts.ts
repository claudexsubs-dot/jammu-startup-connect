import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type DirectoryExpert = Database["public"]["Functions"]["expert_directory"]["Returns"][number];

export type ExpertFilters = {
  q?: string;
  topic?: string;
  centre?: string;
  price?: "free" | "paid";
  format?: "online" | "in_person";
  soon?: boolean;
};

export async function loadExpertDirectory(supabase: SupabaseClient<Database>): Promise<DirectoryExpert[]> {
  const { data, error } = await supabase.rpc("expert_directory");
  if (error) throw new Error("experts_unavailable");
  return data ?? [];
}

export function parseExpertFilters(params: Record<string, string | string[] | undefined>): ExpertFilters {
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : undefined;
  };
  const price = one("price");
  const format = one("format");
  return {
    q: one("q"),
    topic: one("topic"),
    centre: one("centre"),
    price: price === "free" || price === "paid" ? price : undefined,
    format: format === "online" || format === "in_person" ? format : undefined,
    soon: one("soon") === "1",
  };
}

export function hasExpertFilters(f: ExpertFilters) {
  return Boolean(f.q || f.topic || f.centre || f.price || f.format || f.soon);
}

export function filterExperts(experts: DirectoryExpert[], f: ExpertFilters, now = new Date()) {
  const q = f.q?.toLowerCase();
  const topic = f.topic?.toLowerCase();
  const weekAhead = now.getTime() + 7 * 86_400_000;
  return experts.filter((e) => {
    if (q && !`${e.full_name} ${e.headline ?? ""} ${e.organization ?? ""} ${e.center_name} ${e.expertise_tags.join(" ")}`.toLowerCase().includes(q)) return false;
    if (topic && !e.expertise_tags.some((t) => t.toLowerCase() === topic)) return false;
    if (f.centre && e.center_slug !== f.centre) return false;
    if (f.price === "free" && e.is_paid) return false;
    if (f.price === "paid" && !e.is_paid) return false;
    if (f.format === "online" && !e.offers_online) return false;
    if (f.format === "in_person" && !e.offers_in_person) return false;
    if (f.soon && (!e.next_slot_at || new Date(e.next_slot_at).getTime() > weekAhead)) return false;
    return true;
  });
}

// The most common expertise tags, for one-tap topic filters.
export function popularTopics(experts: DirectoryExpert[], limit = 10) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const e of experts) {
    for (const tag of e.expertise_tags) {
      const key = tag.toLowerCase();
      const entry = counts.get(key) ?? { label: tag, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit).map((t) => t.label);
}

export function filterHref(base: ExpertFilters, change: Partial<ExpertFilters>) {
  const merged = { ...base, ...change };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.topic) params.set("topic", merged.topic);
  if (merged.centre) params.set("centre", merged.centre);
  if (merged.price) params.set("price", merged.price);
  if (merged.format) params.set("format", merged.format);
  if (merged.soon) params.set("soon", "1");
  const query = params.toString();
  return query ? `/experts?${query}` : "/experts";
}
