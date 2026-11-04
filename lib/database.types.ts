// Generated from the database schema with `supabase gen types typescript`. Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "application_status_history": {
                  Row: {
                    "application_id": string,"changed_by": string | null,"changed_by_side": string,"created_at": string,"from_status": Database["public"]['Enums']["application_status"] | null,"id": number,"note": string | null,"to_status": Database["public"]['Enums']["application_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"changed_by"?: string | null,"changed_by_side": string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["application_status"] | null,"id"?: never,"note"?: string | null,"to_status": Database["public"]['Enums']["application_status"]
                  }
                  Update: {
                    "application_id"?: string,"changed_by"?: string | null,"changed_by_side"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["application_status"] | null,"id"?: never,"note"?: string | null,"to_status"?: Database["public"]['Enums']["application_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_status_history_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "startup_applications"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"center_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity_id": string | null,"entity_type": string | null,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"center_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"center_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"availability_slots": {
                  Row: {
                    "created_at": string,"created_by": string | null,"ends_at": string,"expert_id": string,"id": string,"is_cancelled": boolean,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"ends_at": string,"expert_id": string,"id"?: string,"is_cancelled"?: boolean,"starts_at": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"ends_at"?: string,"expert_id"?: string,"id"?: string,"is_cancelled"?: boolean,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_slots_expert_id_fkey"
      columns: ["expert_id"]
isOneToOne: false
      referencedRelation: "center_experts"
      referencedColumns: ["id"]
    }
                  ]
                },"booking_events": {
                  Row: {
                    "actor_id": string | null,"actor_side": string,"booking_id": string,"created_at": string,"from_status": Database["public"]['Enums']["booking_status"] | null,"id": number,"note": string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"actor_side": string,"booking_id": string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: never,"note"?: string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_side"?: string,"booking_id"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: never,"note"?: string | null,"to_status"?: Database["public"]['Enums']["booking_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_events_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "consultation_bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"center_experts": {
                  Row: {
                    "bio": string | null,"center_id": string,"created_at": string,"created_by": string | null,"engagement_policy": Database["public"]['Enums']["engagement_policy"],"expertise_tags": (string)[],"fee_inr": number | null,"full_name": string,"headline": string | null,"id": string,"in_person_location": string | null,"is_active": boolean,"is_paid": boolean,"offers_in_person": boolean,"offers_online": boolean,"organization": string | null,"session_minutes": number,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string | null,"center_id": string,"created_at"?: string,"created_by"?: string | null,"engagement_policy"?: Database["public"]['Enums']["engagement_policy"],"expertise_tags"?: (string)[],"fee_inr"?: number | null,"full_name": string,"headline"?: string | null,"id"?: string,"in_person_location"?: string | null,"is_active"?: boolean,"is_paid"?: boolean,"offers_in_person"?: boolean,"offers_online"?: boolean,"organization"?: string | null,"session_minutes"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "bio"?: string | null,"center_id"?: string,"created_at"?: string,"created_by"?: string | null,"engagement_policy"?: Database["public"]['Enums']["engagement_policy"],"expertise_tags"?: (string)[],"fee_inr"?: number | null,"full_name"?: string,"headline"?: string | null,"id"?: string,"in_person_location"?: string | null,"is_active"?: boolean,"is_paid"?: boolean,"offers_in_person"?: boolean,"offers_online"?: boolean,"organization"?: string | null,"session_minutes"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "center_experts_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "center_experts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"center_sectors": {
                  Row: {
                    "center_id": string,"sector_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"sector_id": number
                  }
                  Update: {
                    "center_id"?: string,"sector_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "center_sectors_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "center_sectors_sector_id_fkey"
      columns: ["sector_id"]
isOneToOne: false
      referencedRelation: "sectors"
      referencedColumns: ["id"]
    }
                  ]
                },"center_services": {
                  Row: {
                    "center_id": string,"support_need_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"support_need_id": number
                  }
                  Update: {
                    "center_id"?: string,"support_need_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "center_services_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "center_services_support_need_id_fkey"
      columns: ["support_need_id"]
isOneToOne: false
      referencedRelation: "support_needs"
      referencedColumns: ["id"]
    }
                  ]
                },"center_staff_memberships": {
                  Row: {
                    "center_id": string,"created_at": string,"id": string,"invited_by": string | null,"invited_email": string | null,"revoked_at": string | null,"revoked_by": string | null,"status": Database["public"]['Enums']["staff_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"created_at"?: string,"id"?: string,"invited_by"?: string | null,"invited_email"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"status"?: Database["public"]['Enums']["staff_status"],"user_id": string
                  }
                  Update: {
                    "center_id"?: string,"created_at"?: string,"id"?: string,"invited_by"?: string | null,"invited_email"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"status"?: Database["public"]['Enums']["staff_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "center_staff_memberships_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "center_staff_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"center_stages": {
                  Row: {
                    "center_id": string,"stage_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"stage_id": number
                  }
                  Update: {
                    "center_id"?: string,"stage_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "center_stages_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "center_stages_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "startup_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"consultation_bookings": {
                  Row: {
                    "center_id": string,"created_at": string,"ends_at": string,"expert_id": string,"expert_note": string | null,"fee_inr": number | null,"format": Database["public"]['Enums']["session_format"],"founder_id": string,"founder_note": string | null,"id": string,"is_paid": boolean,"meeting_link": string | null,"meeting_location": string | null,"payment_instructions": string | null,"proposed_note": string | null,"proposed_slot_id": string | null,"session_minutes": number,"slot_id": string,"starts_at": string,"startup_id": string,"status": Database["public"]['Enums']["booking_status"],"status_changed_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"created_at"?: string,"ends_at": string,"expert_id": string,"expert_note"?: string | null,"fee_inr"?: number | null,"format": Database["public"]['Enums']["session_format"],"founder_id": string,"founder_note"?: string | null,"id"?: string,"is_paid": boolean,"meeting_link"?: string | null,"meeting_location"?: string | null,"payment_instructions"?: string | null,"proposed_note"?: string | null,"proposed_slot_id"?: string | null,"session_minutes": number,"slot_id": string,"starts_at": string,"startup_id": string,"status"?: Database["public"]['Enums']["booking_status"],"status_changed_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "center_id"?: string,"created_at"?: string,"ends_at"?: string,"expert_id"?: string,"expert_note"?: string | null,"fee_inr"?: number | null,"format"?: Database["public"]['Enums']["session_format"],"founder_id"?: string,"founder_note"?: string | null,"id"?: string,"is_paid"?: boolean,"meeting_link"?: string | null,"meeting_location"?: string | null,"payment_instructions"?: string | null,"proposed_note"?: string | null,"proposed_slot_id"?: string | null,"session_minutes"?: number,"slot_id"?: string,"starts_at"?: string,"startup_id"?: string,"status"?: Database["public"]['Enums']["booking_status"],"status_changed_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultation_bookings_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_bookings_expert_id_fkey"
      columns: ["expert_id"]
isOneToOne: false
      referencedRelation: "center_experts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_bookings_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_bookings_proposed_slot_id_fkey"
      columns: ["proposed_slot_id"]
isOneToOne: false
      referencedRelation: "availability_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_bookings_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "availability_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_bookings_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"founder_profiles": {
                  Row: {
                    "city": string | null,"consent_given": boolean,"consent_given_at": string | null,"created_at": string,"district": string | null,"domicile_declared": boolean,"domicile_declared_at": string | null,"phone": string | null,"share_contact_with_centres": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"consent_given"?: boolean,"consent_given_at"?: string | null,"created_at"?: string,"district"?: string | null,"domicile_declared"?: boolean,"domicile_declared_at"?: string | null,"phone"?: string | null,"share_contact_with_centres"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "city"?: string | null,"consent_given"?: boolean,"consent_given_at"?: string | null,"created_at"?: string,"district"?: string | null,"domicile_declared"?: boolean,"domicile_declared_at"?: string | null,"phone"?: string | null,"share_contact_with_centres"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "founder_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"incubation_centers": {
                  Row: {
                    "accepting_applications": boolean,"address": string | null,"application_guidance": string | null,"applications_close_on": string | null,"city": string | null,"created_at": string,"created_by": string | null,"description": string | null,"district": string | null,"host_institution": string | null,"id": string,"is_sample": boolean,"name": string,"public_email": string | null,"short_description": string | null,"slug": string,"status": Database["public"]['Enums']["center_status"],"status_reason": string | null,"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepting_applications"?: boolean,"address"?: string | null,"application_guidance"?: string | null,"applications_close_on"?: string | null,"city"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"district"?: string | null,"host_institution"?: string | null,"id"?: string,"is_sample"?: boolean,"name": string,"public_email"?: string | null,"short_description"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["center_status"],"status_reason"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "accepting_applications"?: boolean,"address"?: string | null,"application_guidance"?: string | null,"applications_close_on"?: string | null,"city"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"district"?: string | null,"host_institution"?: string | null,"id"?: string,"is_sample"?: boolean,"name"?: string,"public_email"?: string | null,"short_description"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["center_status"],"status_reason"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"center_id": string,"created_at": string,"email": string,"expert_id": string | null,"expires_at": string,"id": string,"invited_by": string | null,"kind": Database["public"]['Enums']["invitation_kind"],"revoked_at": string | null,"status": Database["public"]['Enums']["invitation_status"],"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"center_id": string,"created_at"?: string,"email": string,"expert_id"?: string | null,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"kind": Database["public"]['Enums']["invitation_kind"],"revoked_at"?: string | null,"status"?: Database["public"]['Enums']["invitation_status"],"token"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"center_id"?: string,"created_at"?: string,"email"?: string,"expert_id"?: string | null,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"kind"?: Database["public"]['Enums']["invitation_kind"],"revoked_at"?: string | null,"status"?: Database["public"]['Enums']["invitation_status"],"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_expert_id_fkey"
      columns: ["expert_id"]
isOneToOne: false
      referencedRelation: "center_experts"
      referencedColumns: ["id"]
    }
                  ]
                },"message_threads": {
                  Row: {
                    "application_id": string | null,"center_archived_at": string | null,"center_id": string,"center_last_read_at": string | null,"created_at": string,"founder_archived_at": string | null,"founder_last_read_at": string | null,"id": string,"last_message_at": string,"started_by": string | null,"started_by_side": string,"startup_id": string,"subject": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"center_archived_at"?: string | null,"center_id": string,"center_last_read_at"?: string | null,"created_at"?: string,"founder_archived_at"?: string | null,"founder_last_read_at"?: string | null,"id"?: string,"last_message_at"?: string,"started_by"?: string | null,"started_by_side": string,"startup_id": string,"subject": string
                  }
                  Update: {
                    "application_id"?: string | null,"center_archived_at"?: string | null,"center_id"?: string,"center_last_read_at"?: string | null,"created_at"?: string,"founder_archived_at"?: string | null,"founder_last_read_at"?: string | null,"id"?: string,"last_message_at"?: string,"started_by"?: string | null,"started_by_side"?: string,"startup_id"?: string,"subject"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "message_threads_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "startup_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_threads_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_threads_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"hidden_at": string | null,"hidden_by": string | null,"hidden_reason": string | null,"id": string,"sender_id": string | null,"sender_side": string,"thread_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"hidden_at"?: string | null,"hidden_by"?: string | null,"hidden_reason"?: string | null,"id"?: string,"sender_id"?: string | null,"sender_side": string,"thread_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"hidden_at"?: string | null,"hidden_by"?: string | null,"hidden_reason"?: string | null,"id"?: string,"sender_id"?: string | null,"sender_side"?: string,"thread_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_thread_id_fkey"
      columns: ["thread_id"]
isOneToOne: false
      referencedRelation: "message_threads"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"kind": string,"link": string | null,"read_at": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"link"?: string | null,"read_at"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"link"?: string | null,"read_at"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"is_suspended": boolean,"suspended_at": string | null,"suspension_reason": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"is_suspended"?: boolean,"suspended_at"?: string | null,"suspension_reason"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"is_suspended"?: boolean,"suspended_at"?: string | null,"suspension_reason"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"message_id": string | null,"reason": string,"reporter_id": string,"reporter_side": string,"resolution_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["report_status"],"thread_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message_id"?: string | null,"reason": string,"reporter_id": string,"reporter_side": string,"resolution_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"thread_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message_id"?: string | null,"reason"?: string,"reporter_id"?: string,"reporter_side"?: string,"resolution_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"thread_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_thread_id_fkey"
      columns: ["thread_id"]
isOneToOne: false
      referencedRelation: "message_threads"
      referencedColumns: ["id"]
    }
                  ]
                },"sectors": {
                  Row: {
                    "id": number,"is_active": boolean,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"is_active"?: boolean,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: never,"is_active"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"startup_applications": {
                  Row: {
                    "center_id": string,"cover_note": string | null,"created_at": string,"decided_at": string | null,"founder_id": string,"founder_response": string | null,"id": string,"last_status_at": string,"profile_snapshot": Json | null,"share_financials": boolean,"snapshot_taken_at": string | null,"startup_id": string,"status": Database["public"]['Enums']["application_status"],"submitted_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "center_id": string,"cover_note"?: string | null,"created_at"?: string,"decided_at"?: string | null,"founder_id": string,"founder_response"?: string | null,"id"?: string,"last_status_at"?: string,"profile_snapshot"?: Json | null,"share_financials"?: boolean,"snapshot_taken_at"?: string | null,"startup_id": string,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "center_id"?: string,"cover_note"?: string | null,"created_at"?: string,"decided_at"?: string | null,"founder_id"?: string,"founder_response"?: string | null,"id"?: string,"last_status_at"?: string,"profile_snapshot"?: Json | null,"share_financials"?: boolean,"snapshot_taken_at"?: string | null,"startup_id"?: string,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_applications_center_id_fkey"
      columns: ["center_id"]
isOneToOne: false
      referencedRelation: "incubation_centers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_applications_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_applications_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_financials": {
                  Row: {
                    "annual_revenue": number | null,"as_of_date": string,"cash_balance": number | null,"cash_runway_months": number | null,"created_at": string,"created_by": string | null,"currency": string,"id": string,"monthly_burn_rate": number | null,"monthly_operating_expenses": number | null,"startup_id": string,"total_funding_received": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "annual_revenue"?: number | null,"as_of_date"?: string,"cash_balance"?: number | null,"cash_runway_months"?: never,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"monthly_burn_rate"?: number | null,"monthly_operating_expenses"?: number | null,"startup_id": string,"total_funding_received"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "annual_revenue"?: number | null,"as_of_date"?: string,"cash_balance"?: number | null,"cash_runway_months"?: never,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"monthly_burn_rate"?: number | null,"monthly_operating_expenses"?: number | null,"startup_id"?: string,"total_funding_received"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_financials_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_financials_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_member_contacts": {
                  Row: {
                    "email": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string,"member_id": string
                  }
                  Update: {
                    "email"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_member_contacts_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "startup_members"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_members": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"is_founder": boolean,"linkedin_url": string | null,"role_title": string | null,"startup_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id"?: string,"is_founder"?: boolean,"linkedin_url"?: string | null,"role_title"?: string | null,"startup_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"is_founder"?: boolean,"linkedin_url"?: string | null,"role_title"?: string | null,"startup_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_members_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_sectors": {
                  Row: {
                    "sector_id": number,"startup_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "sector_id": number,"startup_id": string
                  }
                  Update: {
                    "sector_id"?: number,"startup_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_sectors_sector_id_fkey"
      columns: ["sector_id"]
isOneToOne: false
      referencedRelation: "sectors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_sectors_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_stages": {
                  Row: {
                    "code": string,"description": string | null,"id": number,"is_active": boolean,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"description"?: string | null,"id"?: never,"is_active"?: boolean,"name": string,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"description"?: string | null,"id"?: never,"is_active"?: boolean,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"startup_support_needs": {
                  Row: {
                    "startup_id": string,"support_need_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "startup_id": string,"support_need_id": number
                  }
                  Update: {
                    "startup_id"?: string,"support_need_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_support_needs_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_support_needs_support_need_id_fkey"
      columns: ["support_need_id"]
isOneToOne: false
      referencedRelation: "support_needs"
      referencedColumns: ["id"]
    }
                  ]
                },"startups": {
                  Row: {
                    "city": string | null,"created_at": string,"demo_url": string | null,"description": string | null,"district": string | null,"domain": string | null,"dpiit_recognised": boolean,"founding_year": number | null,"id": string,"legal_status": Database["public"]['Enums']["legal_status"],"name": string,"offering_type": Database["public"]['Enums']["offering_type"] | null,"owner_id": string,"pitch_deck_url": string | null,"problem": string | null,"registration_number": string | null,"solution": string | null,"stage_id": number | null,"state": string,"target_customers": string | null,"traction_level": Database["public"]['Enums']["traction_level"] | null,"traction_summary": string | null,"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description"?: string | null,"district"?: string | null,"domain"?: string | null,"dpiit_recognised"?: boolean,"founding_year"?: number | null,"id"?: string,"legal_status"?: Database["public"]['Enums']["legal_status"],"name": string,"offering_type"?: Database["public"]['Enums']["offering_type"] | null,"owner_id": string,"pitch_deck_url"?: string | null,"problem"?: string | null,"registration_number"?: string | null,"solution"?: string | null,"stage_id"?: number | null,"state"?: string,"target_customers"?: string | null,"traction_level"?: Database["public"]['Enums']["traction_level"] | null,"traction_summary"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description"?: string | null,"district"?: string | null,"domain"?: string | null,"dpiit_recognised"?: boolean,"founding_year"?: number | null,"id"?: string,"legal_status"?: Database["public"]['Enums']["legal_status"],"name"?: string,"offering_type"?: Database["public"]['Enums']["offering_type"] | null,"owner_id"?: string,"pitch_deck_url"?: string | null,"problem"?: string | null,"registration_number"?: string | null,"solution"?: string | null,"stage_id"?: number | null,"state"?: string,"target_customers"?: string | null,"traction_level"?: Database["public"]['Enums']["traction_level"] | null,"traction_summary"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "startups_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startups_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "startup_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"support_needs": {
                  Row: {
                    "description": string | null,"id": number,"is_active": boolean,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"id"?: never,"is_active"?: boolean,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: string | null,"id"?: never,"is_active"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "granted_at": string,"role": Database["public"]['Enums']["platform_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"role": Database["public"]['Enums']["platform_role"],"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"role"?: Database["public"]['Enums']["platform_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_token": string }; Returns: string
                           },
"admin_hide_message":
{ Args: { "p_message_id": string,"p_reason": string }; Returns: undefined
                           },
"admin_invite_staff":
{ Args: { "p_center_id": string,"p_email": string }; Returns: string
                           },
"admin_list_users":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_search"?: string }; Returns: {
              "created_at": string,"domicile_declared": boolean,"full_name": string,"id": string,"is_suspended": boolean,"masked_email": string,"roles": (string)[],"suspension_reason": string
            }[]
                           },
"admin_platform_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_resolve_report":
{ Args: { "p_note"?: string,"p_report_id": string,"p_status": Database["public"]['Enums']["report_status"] }; Returns: undefined
                           },
"admin_revoke_staff":
{ Args: { "p_membership_id": string }; Returns: undefined
                           },
"admin_set_user_suspension":
{ Args: { "p_reason"?: string,"p_suspended": boolean,"p_user_id": string }; Returns: undefined
                           },
"available_slots":
{ Args: { "p_expert_id": string }; Returns: {
              "ends_at": string,"id": string,"starts_at": string
            }[]
                           },
"booking_eligibility":
{ Args: { "p_expert_id": string }; Returns: string
                           },
"center_stats":
{ Args: { "p_center_id": string }; Returns: Json
                           },
"change_application_status":
{ Args: { "p_application_id": string,"p_note"?: string,"p_status": Database["public"]['Enums']["application_status"] }; Returns: undefined
                           },
"founder_update_booking":
{ Args: { "p_action": string,"p_booking_id": string,"p_note"?: string }; Returns: undefined
                           },
"invitation_details":
{ Args: { "p_token": string }; Returns: {
              "center_name": string,"email_matches": boolean,"expert_name": string,"is_valid": boolean,"kind": Database["public"]['Enums']["invitation_kind"]
            }[]
                           },
"invite_expert":
{ Args: { "p_email": string,"p_expert_id": string }; Returns: string
                           },
"log_access_denied":
{ Args: { "p_path": string }; Returns: undefined
                           },
"mark_notifications_read":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"mark_thread_read":
{ Args: { "p_thread_id": string }; Returns: undefined
                           },
"report_thread":
{ Args: { "p_message_id"?: string,"p_reason": string,"p_thread_id": string }; Returns: string
                           },
"request_booking":
{ Args: { "p_format": Database["public"]['Enums']["session_format"],"p_note"?: string,"p_slot_id": string }; Returns: string
                           },
"respond_to_information_request":
{ Args: { "p_application_id": string,"p_response": string }; Returns: undefined
                           },
"revoke_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"save_application_draft":
{ Args: { "p_application_id": string,"p_cover_note": string,"p_share_financials": boolean }; Returns: undefined
                           },
"send_message":
{ Args: { "p_body": string,"p_thread_id": string }; Returns: string
                           },
"set_thread_archived":
{ Args: { "p_archived": boolean,"p_thread_id": string }; Returns: undefined
                           },
"start_application":
{ Args: { "p_center_id": string }; Returns: string
                           },
"start_thread":
{ Args: { "p_application_id"?: string,"p_body": string,"p_center_id": string,"p_startup_id": string,"p_subject": string }; Returns: string
                           },
"startup_contact":
{ Args: { "p_startup_id": string }; Returns: {
              "email": string,"phone": string,"shared": boolean
            }[]
                           },
"startup_profile_gaps":
{ Args: { "p_startup_id": string }; Returns: (string)[]
                           },
"submit_application":
{ Args: { "p_application_id": string }; Returns: undefined
                           },
"update_booking":
{ Args: { "p_action": string,"p_booking_id": string,"p_meeting_link"?: string,"p_meeting_location"?: string,"p_note"?: string,"p_payment_instructions"?: string,"p_proposed_slot_id"?: string }; Returns: undefined
                           }
          }
          Enums: {
            "application_status": "draft"|"submitted"|"under_review"|"more_information_needed"|"accepted"|"rejected"|"waitlisted","booking_status": "pending"|"payment_instructions_sent"|"confirmed"|"declined"|"cancelled"|"completed"|"no_show","center_status": "active"|"suspended"|"archived","engagement_policy": "pre_admission"|"admitted_only"|"both","invitation_kind": "center_staff"|"expert","invitation_status": "pending"|"accepted"|"revoked","legal_status": "not_registered"|"registration_in_progress"|"sole_proprietorship"|"partnership"|"llp"|"private_limited"|"public_limited"|"other","offering_type": "product"|"service"|"both","platform_role": "founder"|"expert"|"center_staff"|"platform_admin","report_status": "open"|"resolved"|"dismissed","session_format": "online"|"in_person","staff_status": "active"|"revoked","traction_level": "pre_launch"|"pilots"|"paying_customers"|"growing_revenue"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "application_status": ["draft", "submitted", "under_review", "more_information_needed", "accepted", "rejected", "waitlisted"],"booking_status": ["pending", "payment_instructions_sent", "confirmed", "declined", "cancelled", "completed", "no_show"],"center_status": ["active", "suspended", "archived"],"engagement_policy": ["pre_admission", "admitted_only", "both"],"invitation_kind": ["center_staff", "expert"],"invitation_status": ["pending", "accepted", "revoked"],"legal_status": ["not_registered", "registration_in_progress", "sole_proprietorship", "partnership", "llp", "private_limited", "public_limited", "other"],"offering_type": ["product", "service", "both"],"platform_role": ["founder", "expert", "center_staff", "platform_admin"],"report_status": ["open", "resolved", "dismissed"],"session_format": ["online", "in_person"],"staff_status": ["active", "revoked"],"traction_level": ["pre_launch", "pilots", "paying_customers", "growing_revenue"]
          }
        }
} as const
