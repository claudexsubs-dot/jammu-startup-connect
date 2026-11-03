import type { Enums } from "@/lib/database.types";

export const STAGES: { value: Enums<"startup_stage">; label: string }[] = [
  { value: "ideation", label: "Ideation" },
  { value: "validation", label: "Validation" },
  { value: "early_development", label: "Early Development" },
  { value: "early_traction", label: "Early Traction" },
  { value: "scaling", label: "Scaling" },
  { value: "established", label: "Established" },
];

export const LEGAL_STATUSES: { value: Enums<"legal_status">; label: string }[] = [
  { value: "not_registered", label: "Not registered" },
  { value: "registration_in_progress", label: "Registration in progress" },
  { value: "sole_proprietorship", label: "Sole proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "private_limited", label: "Private Limited" },
  { value: "public_limited", label: "Public Limited" },
  { value: "other", label: "Other" },
];

export const OFFERING_TYPES: { value: Enums<"offering_type">; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "both", label: "Product and service" },
];

// Districts of the Jammu division, plus an option for founders based elsewhere.
export const DISTRICTS = [
  "Jammu",
  "Samba",
  "Kathua",
  "Udhampur",
  "Reasi",
  "Doda",
  "Kishtwar",
  "Ramban",
  "Poonch",
  "Rajouri",
  "Other",
] as const;

export function labelFor<T extends string>(list: { value: T; label: string }[], value: T | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? "";
}
