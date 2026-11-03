// Allowed values for the database's enum columns, kept in step with the migration.
export const Constants = {
  startup_stage: ["ideation", "validation", "early_development", "early_traction", "scaling", "established"],
  legal_status: [
    "not_registered",
    "registration_in_progress",
    "sole_proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
    "other",
  ],
  offering_type: ["product", "service", "both"],
} as const;
