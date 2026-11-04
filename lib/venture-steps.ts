export const STEPS = ["founder", "basics", "problem", "traction", "support"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_TITLES: Record<Step, string> = {
  founder: "About you",
  basics: "Startup basics",
  problem: "Problem and solution",
  traction: "Traction and links",
  support: "Support you need",
};
