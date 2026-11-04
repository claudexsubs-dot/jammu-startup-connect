import { expect, test } from "@playwright/test";
import { filterCentres, isOpenForApplications, parseFilters, type CentreSummary } from "../../lib/directory";
import { recommendCentres } from "../../lib/recommend";

// Pure logic: no browser or database needed.
const centre = (overrides: Partial<CentreSummary>): CentreSummary => ({
  id: overrides.slug ?? "c",
  slug: "c",
  name: "Centre",
  shortDescription: null,
  hostInstitution: null,
  district: "Jammu",
  city: "Jammu",
  isSample: false,
  acceptingApplications: true,
  applicationsCloseOn: null,
  openForApplications: true,
  stageIds: [],
  sectorIds: [],
  serviceIds: [],
  expertCount: 0,
  paidExpertCount: 0,
  ...overrides,
});

const names = {
  stages: new Map([
    [1, { code: "ideation", name: "Ideation" }],
    [2, { code: "early_stage", name: "Early stage" }],
  ]),
  sectors: new Map([
    [10, "Agriculture and Food Processing"],
    [11, "IT and Software"],
  ]),
  needs: new Map([
    [20, "Mentorship"],
    [21, "Market access"],
  ]),
};

const venture = { stageId: 2, sectorIds: [10], supportNeedIds: [20, 21], district: "Kathua" };

test("recommendations explain the match in plain words", () => {
  const [top] = recommendCentres(venture, [centre({ slug: "agri", name: "Agri Lab", stageIds: [2], sectorIds: [10], serviceIds: [20, 21], district: "Kathua", expertCount: 2 })], names);
  expect(top.explanation).toBe(
    "Recommended because this centre supports early-stage Agriculture and Food Processing ventures, offers mentorship and market access, is based in your district (Kathua) and lists 2 mentors or experts.",
  );
  expect(top.caveats).toEqual([]);
});

test("recommendations rank better matches first and skip centres with no stage or sector match", () => {
  const results = recommendCentres(
    venture,
    [
      centre({ slug: "weak", name: "Weak", sectorIds: [10], serviceIds: [20] }),
      centre({ slug: "too-weak", name: "Sector only", sectorIds: [10] }),
      centre({ slug: "strong", name: "Strong", stageIds: [2], sectorIds: [10], serviceIds: [20] }),
      centre({ slug: "none", name: "Unrelated", stageIds: [1], sectorIds: [11], serviceIds: [20, 21] }),
    ],
    names,
  );
  expect(results.map((r) => r.centre.slug)).toEqual(["strong", "weak"]);
  expect(results[1].caveats).toContain("It doesn't list your stage.");
});

test("closed centres can still be recommended but say so", () => {
  const [result] = recommendCentres(venture, [centre({ stageIds: [2], sectorIds: [10], openForApplications: false })], names);
  expect(result.caveats).toContain("It isn't accepting applications right now.");
});

test("directory filters combine, and an empty result is possible", () => {
  const centres = [
    centre({ slug: "a", name: "Tawi Hub", stageIds: [1], sectorIds: [11], expertCount: 1 }),
    centre({ slug: "b", name: "Kathua Lab", district: "Kathua", stageIds: [2], sectorIds: [10], openForApplications: false }),
  ];
  expect(filterCentres(centres, { stage: 2 }).map((c) => c.slug)).toEqual(["b"]);
  expect(filterCentres(centres, { district: "Kathua", accepting: true })).toEqual([]);
  expect(filterCentres(centres, { experts: true }).map((c) => c.slug)).toEqual(["a"]);
  expect(filterCentres(centres, { q: "tawi" }).map((c) => c.slug)).toEqual(["a"]);
});

test("filters from the address bar are validated", () => {
  expect(parseFilters({ stage: "2", sector: "abc", support: "-1", accepting: "1", q: "x".repeat(200) })).toMatchObject({
    stage: 2,
    sector: undefined,
    support: undefined,
    accepting: true,
    q: "x".repeat(80),
  });
});

test("applications close at the end of the closing date in India time", () => {
  expect(isOpenForApplications(true, "2026-11-04", new Date("2026-11-04T18:00:00Z"))).toBe(true);
  expect(isOpenForApplications(true, "2026-11-04", new Date("2026-11-04T18:31:00Z"))).toBe(false);
  expect(isOpenForApplications(false, null)).toBe(false);
});
