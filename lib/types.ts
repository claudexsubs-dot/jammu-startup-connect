import type { Database } from "@/lib/database.types";

type PublicSchema = Database["public"];

export type Row<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Insert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type Update<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enum<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type ApplicationStatus = Enum<"application_status">;
export type BookingStatus = Enum<"booking_status">;
export type CenterStatus = Enum<"center_status">;
export type EngagementPolicy = Enum<"engagement_policy">;
export type SessionFormat = Enum<"session_format">;
export type TractionLevel = Enum<"traction_level">;

export type Stage = Row<"startup_stages">;
export type Sector = Row<"sectors">;
export type SupportNeed = Row<"support_needs">;

// The copy of a startup profile stored with each application.
export type ProfileSnapshot = {
  startup: {
    name: string;
    description: string | null;
    founding_year: number | null;
    stage: string | null;
    stage_code: string | null;
    problem: string | null;
    solution: string | null;
    target_customers: string | null;
    offering_type: string | null;
    domain: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    legal_status: string | null;
    registration_number: string | null;
    dpiit_recognised: boolean;
    traction_level: TractionLevel | null;
    traction_summary: string | null;
    website: string | null;
    pitch_deck_url: string | null;
    demo_url: string | null;
  };
  sectors: string[];
  support_needs: string[];
  team: { full_name: string; role_title: string | null; is_founder: boolean; linkedin_url: string | null }[];
  founder: {
    full_name: string | null;
    district: string | null;
    city: string | null;
    domicile_self_declared: boolean;
    contact: { email: string | null; phone: string | null } | null;
  };
  financials: {
    as_of_date: string;
    currency: string;
    annual_revenue: number | null;
    monthly_operating_expenses: number | null;
    cash_balance: number | null;
    total_funding_received: number | null;
    monthly_burn_rate: number | null;
    cash_runway_months: number | null;
  } | null;
};
