import type { ApplicationStatus, BookingStatus, CenterStatus, EngagementPolicy, Enum, SessionFormat, TractionLevel } from "@/lib/types";

type Option<T extends string> = { value: T; label: string };

export const LEGAL_STATUSES: Option<Enum<"legal_status">>[] = [
  { value: "not_registered", label: "Not registered yet" },
  { value: "registration_in_progress", label: "Registration in progress" },
  { value: "sole_proprietorship", label: "Sole proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "private_limited", label: "Private Limited" },
  { value: "public_limited", label: "Public Limited" },
  { value: "other", label: "Other" },
];

export const OFFERING_TYPES: Option<Enum<"offering_type">>[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "both", label: "Product and service" },
];

export const TRACTION_LEVELS: Option<TractionLevel>[] = [
  { value: "pre_launch", label: "Not launched yet" },
  { value: "pilots", label: "Pilots or early users" },
  { value: "paying_customers", label: "Paying customers" },
  { value: "growing_revenue", label: "Steady, growing revenue" },
];

export const APPLICATION_STATUSES: Option<ApplicationStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "more_information_needed", label: "More information needed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Not selected" },
  { value: "waitlisted", label: "Waitlisted" },
];

// What centre staff may move an application to, from each status. Mirrors the database.
export const NEXT_APPLICATION_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: [],
  submitted: ["under_review", "more_information_needed", "accepted", "rejected", "waitlisted"],
  under_review: ["more_information_needed", "accepted", "rejected", "waitlisted"],
  more_information_needed: ["under_review", "accepted", "rejected", "waitlisted"],
  waitlisted: ["under_review", "accepted", "rejected"],
  accepted: [],
  rejected: [],
};

export const BOOKING_STATUSES: Option<BookingStatus>[] = [
  { value: "pending", label: "Pending" },
  { value: "payment_instructions_sent", label: "Payment instructions sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
];

export const LIVE_BOOKING_STATUSES: BookingStatus[] = ["pending", "payment_instructions_sent", "confirmed"];

export const CENTER_STATUSES: Option<CenterStatus>[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Removed" },
];

export const ENGAGEMENT_POLICIES: Option<EngagementPolicy>[] = [
  { value: "both", label: "Any founder" },
  { value: "pre_admission", label: "Founders not yet admitted (pre-admission support)" },
  { value: "admitted_only", label: "Only founders admitted to this centre" },
];

export const SESSION_FORMATS: Option<SessionFormat>[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
];

// Districts of the Jammu division, plus an option for founders based elsewhere.
export const DISTRICTS = ["Jammu", "Samba", "Kathua", "Udhampur", "Reasi", "Doda", "Kishtwar", "Ramban", "Poonch", "Rajouri", "Other"] as const;

// Where centres can be: the whole of Jammu and Kashmir, since founders may apply anywhere.
export const KASHMIR_DISTRICTS = ["Srinagar", "Budgam", "Ganderbal", "Pulwama", "Shopian", "Anantnag", "Kulgam", "Baramulla", "Bandipora", "Kupwara"] as const;
export const CENTRE_DISTRICTS = [...DISTRICTS.filter((d) => d !== "Other"), ...KASHMIR_DISTRICTS] as const;

export function regionOf(district: string | null | undefined) {
  if (!district) return null;
  return (KASHMIR_DISTRICTS as readonly string[]).includes(district) ? "Kashmir division" : "Jammu division";
}

export function labelFor<T extends string>(list: Option<T>[], value: T | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? "";
}

export function policyExplanation(policy: EngagementPolicy) {
  if (policy === "admitted_only") return "Available only to startups admitted to this centre.";
  if (policy === "pre_admission") return "Offers pre-admission support to founders who have not yet been admitted to this centre.";
  return "Available to any founder on UdyamSetu.";
}
