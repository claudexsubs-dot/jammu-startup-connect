import type { CentreSummary } from "@/lib/directory";

export type VentureForMatching = {
  stageId: number | null;
  sectorIds: number[];
  supportNeedIds: number[];
  district: string | null;
};

export type Recommendation = {
  centre: CentreSummary;
  score: number;
  explanation: string;
  caveats: string[];
};

type Names = {
  stages: Map<number, { code: string; name: string }>;
  sectors: Map<number, string>;
  needs: Map<number, string>;
};

export function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function stageAdjective(stage: { code: string; name: string }) {
  if (stage.code === "ideation") return "ideation-stage";
  if (stage.code === "early_stage") return "early-stage";
  if (stage.code === "established") return "established";
  return `${stage.name.toLowerCase()}-stage`;
}

const lower = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

// Scores each centre against the venture and explains the match in plain words.
// It only ranks: founders can still browse and apply to any centre.
export function recommendCentres(venture: VentureForMatching, centres: CentreSummary[], names: Names, limit = 5): Recommendation[] {
  const results: Recommendation[] = [];

  for (const centre of centres) {
    const stage = venture.stageId !== null && centre.stageIds.includes(venture.stageId) ? names.stages.get(venture.stageId) : undefined;
    const sectors = venture.sectorIds.filter((id) => centre.sectorIds.includes(id)).map((id) => names.sectors.get(id) ?? "");
    const needs = venture.supportNeedIds.filter((id) => centre.serviceIds.includes(id)).map((id) => names.needs.get(id) ?? "");
    const sameDistrict = Boolean(venture.district && centre.district && venture.district === centre.district);

    if (!stage && sectors.length === 0) continue;

    let score = 0;
    if (stage) score += 3;
    if (sectors.length) score += 3;
    score += Math.min(needs.length, 3) * 2;
    if (sameDistrict) score += 1;
    if (centre.expertCount > 0) score += 1;
    if (centre.openForApplications) score += 1;
    if (score < 5) continue;

    const clauses: string[] = [];
    if (stage && sectors.length) clauses.push(`supports ${stageAdjective(stage)} ${joinAnd(sectors)} ventures`);
    else if (stage) clauses.push(`supports ${stageAdjective(stage)} ventures`);
    else clauses.push(`works with ${joinAnd(sectors)} ventures`);
    if (needs.length) clauses.push(`offers ${joinAnd(needs.map(lower))}`);
    if (sameDistrict) clauses.push(`is based in your district (${centre.district})`);
    if (centre.expertCount > 0) clauses.push(`lists ${centre.expertCount} mentor${centre.expertCount === 1 ? "" : "s"} or expert${centre.expertCount === 1 ? "" : "s"}`);

    const caveats: string[] = [];
    if (!centre.openForApplications) caveats.push("It isn't accepting applications right now.");
    if (!stage && venture.stageId !== null) caveats.push("It doesn't list your stage.");

    results.push({ centre, score, explanation: `Recommended because this centre ${joinAnd(clauses)}.`, caveats });
  }

  return results.sort((a, b) => b.score - a.score || a.centre.name.localeCompare(b.centre.name)).slice(0, limit);
}
