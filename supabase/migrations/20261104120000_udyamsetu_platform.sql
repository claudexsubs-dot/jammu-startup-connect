-- UdyamSetu platform
-- Turns the Phase 1 schema (founders + startup profiles) into the full MVP:
-- configurable taxonomy, incubation centres, centre staff, mentors and paid experts,
-- availability and booking requests, applications with status history, private
-- messaging with reports, notifications and an audit log.
--
-- Existing data is kept: profiles, roles, startups, team members and financial figures
-- are carried over and reshaped. Nothing is deleted.
--
-- Security model
-- * Every table has Row Level Security.
-- * Simple edits (a founder's own startup, a centre's own profile, an expert's own slots)
--   go straight to the tables and are checked by RLS policies.
-- * Workflow steps (submitting an application, changing its status, messaging, booking
--   requests, invitations, admin actions) go through the functions at the end of this file.
--   They check who is calling, write history and audit rows, and send notifications.
-- * Helper functions that look up roles live in the `private` schema, which the API does
--   not expose.

create extension if not exists btree_gist with schema extensions;

-- ===========================================================================
-- 1. Remove Phase 1 policies and helpers that the new model replaces
-- ===========================================================================
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Read own roles" on public.user_roles;
drop policy if exists "Anyone can read sectors" on public.sectors;
drop policy if exists "Visitors read published startups" on public.startups;
drop policy if exists "Read published or own startups" on public.startups;
drop policy if exists "Create startups as owner" on public.startups;
drop policy if exists "Owner and editors update startups" on public.startups;
drop policy if exists "Owner deletes startups" on public.startups;
drop policy if exists "Team reads its members" on public.startup_members;
drop policy if exists "Owner adds team members" on public.startup_members;
drop policy if exists "Owner edits team members" on public.startup_members;
drop policy if exists "Owner removes team members" on public.startup_members;
drop policy if exists "Editors read financials" on public.startup_financials;
drop policy if exists "Editors add financials" on public.startup_financials;
drop policy if exists "Editors update financials" on public.startup_financials;
drop policy if exists "Editors delete financials" on public.startup_financials;

drop function if exists private.is_startup_member(uuid);
drop function if exists private.can_edit_startup(uuid);

-- ===========================================================================
-- 2. Shared taxonomy, managed by the master admin
-- ===========================================================================
create table public.startup_stages (
  id smallint generated always as identity primary key,
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  name text not null unique check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 300),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

insert into public.startup_stages (code, name, description, sort_order) values
  ('ideation', 'Ideation', 'You have an idea and are checking that the problem is real.', 1),
  ('early_stage', 'Early stage', 'You are building the product, running pilots or have your first customers.', 2),
  ('established', 'Established', 'You have a working product, regular customers and are growing.', 3);

alter table public.sectors
  add column sort_order smallint not null default 0,
  add column is_active boolean not null default true;
alter table public.sectors add constraint sectors_name_length check (char_length(name) between 2 and 80);
alter table public.sectors add constraint sectors_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create table public.support_needs (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 300),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

insert into public.support_needs (slug, name, description, sort_order) values
  ('mentorship', 'Mentorship', 'Regular guidance from experienced founders or experts.', 1),
  ('prototype-lab-access', 'Prototype and lab access', 'Workshops, labs, testing equipment or maker space.', 2),
  ('business-model', 'Business model', 'Pricing, unit economics and how the business makes money.', 3),
  ('market-access', 'Market access', 'First customers, distribution partners and sales channels.', 4),
  ('legal-compliance', 'Legal and compliance', 'Registration, licences, contracts and intellectual property.', 5),
  ('funding-readiness', 'Funding readiness', 'Preparing pitch materials and financial plans for investors or grants.', 6),
  ('technology', 'Technology', 'Product engineering, software and technical architecture.', 7),
  ('networking', 'Networking', 'Introductions to peers, industry and the wider ecosystem.', 8),
  ('workspace', 'Workspace', 'A desk or office space at the centre.', 9);

-- ===========================================================================
-- 3. People: accounts, founder details, roles
-- ===========================================================================
alter table public.profiles
  add column is_suspended boolean not null default false,
  add column suspended_at timestamptz,
  add column suspension_reason text check (char_length(suspension_reason) <= 500);

-- Founder-only details. Phone and contact sharing are private to the founder.
create table public.founder_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text check (char_length(phone) <= 20),
  district text check (char_length(district) <= 60),
  city text check (char_length(city) <= 80),
  domicile_declared boolean not null default false,
  domicile_declared_at timestamptz,
  consent_given boolean not null default false,
  consent_given_at timestamptz,
  share_contact_with_centres boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Carry over phone numbers already saved on profiles.
insert into public.founder_profiles (user_id, phone)
select p.id, p.phone
from public.profiles p
where exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'founder');

alter table public.profiles drop column phone;

-- Role names now match the platform: founder, center_staff, expert, platform_admin.
alter type public.platform_role rename value 'mentor' to 'expert';
alter type public.platform_role rename value 'incubator_admin' to 'center_staff';

-- ===========================================================================
-- 4. Startups (venture profiles)
-- ===========================================================================
create type public.traction_level as enum ('pre_launch', 'pilots', 'paying_customers', 'growing_revenue');

alter table public.startups
  add column stage_id smallint references public.startup_stages (id),
  add column problem text check (char_length(problem) <= 2000),
  add column traction_level public.traction_level,
  add column traction_summary text check (char_length(traction_summary) <= 2000),
  add column pitch_deck_url text check (char_length(pitch_deck_url) <= 300 and pitch_deck_url ~* '^https?://'),
  add column demo_url text check (char_length(demo_url) <= 300 and demo_url ~* '^https?://');

alter table public.startups rename column product_or_service to solution;

-- Map the six Phase 1 stages onto the three UdyamSetu stages.
update public.startups s
set stage_id = st.id
from public.startup_stages st
where st.code = case s.stage::text
  when 'ideation' then 'ideation'
  when 'validation' then 'ideation'
  when 'early_development' then 'early_stage'
  when 'early_traction' then 'early_stage'
  else 'established'
end;

create table public.startup_sectors (
  startup_id uuid not null references public.startups (id) on delete cascade,
  sector_id smallint not null references public.sectors (id),
  primary key (startup_id, sector_id)
);
create index startup_sectors_sector_idx on public.startup_sectors (sector_id);

insert into public.startup_sectors (startup_id, sector_id)
select id, sector_id from public.startups where sector_id is not null;

create table public.startup_support_needs (
  startup_id uuid not null references public.startups (id) on delete cascade,
  support_need_id smallint not null references public.support_needs (id),
  primary key (startup_id, support_need_id)
);
create index startup_support_needs_need_idx on public.startup_support_needs (support_need_id);

-- Startup profiles are seen by their founder, centre staff and admins. There is no public listing.
alter table public.startups drop column is_published;
alter table public.startups drop column stage;
alter table public.startups drop column sector_id;
drop type public.startup_stage;

alter table public.startups add constraint startups_website_format check (website ~* '^https?://') not valid;
create index startups_stage_idx on public.startups (stage_id);
create index startups_traction_idx on public.startups (traction_level);
drop index if exists public.startups_owner_id_idx;
create unique index startups_one_per_founder on public.startups (owner_id);

-- Team members: names and roles only. Contact emails move to a table only the founder can read.
create table public.startup_member_contacts (
  member_id uuid primary key references public.startup_members (id) on delete cascade,
  email text not null check (char_length(email) <= 254)
);

insert into public.startup_member_contacts (member_id, email)
select id, email from public.startup_members where email is not null;

alter table public.startup_members drop column email;
alter table public.startup_members drop column access;
alter table public.startup_members drop column user_id;
create index startup_members_startup_idx on public.startup_members (startup_id);

drop index if exists public.startup_members_user_id_idx;
drop type public.member_access;

-- New startups list their founder on the team automatically.
create or replace function private.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.startup_members (startup_id, full_name, role_title, is_founder)
  select new.id, coalesce(p.full_name, 'Founder'), 'Founder', true
  from public.profiles p
  where p.id = new.owner_id;
  return new;
end;
$$;

-- ===========================================================================
-- 5. Incubation centres, staff and invitations
-- ===========================================================================
create type public.center_status as enum ('active', 'suspended', 'archived');

create table public.incubation_centers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 2 and 150),
  short_description text check (char_length(short_description) <= 300),
  description text check (char_length(description) <= 5000),
  host_institution text check (char_length(host_institution) <= 150),
  district text check (char_length(district) <= 60),
  city text check (char_length(city) <= 80),
  address text check (char_length(address) <= 300),
  website text check (char_length(website) <= 300 and website ~* '^https?://'),
  public_email text check (char_length(public_email) <= 254),
  application_guidance text check (char_length(application_guidance) <= 5000),
  accepting_applications boolean not null default true,
  applications_close_on date,
  status public.center_status not null default 'active',
  status_reason text check (char_length(status_reason) <= 500),
  is_sample boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index incubation_centers_status_idx on public.incubation_centers (status);

create table public.center_stages (
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  stage_id smallint not null references public.startup_stages (id),
  primary key (center_id, stage_id)
);
create index center_stages_stage_idx on public.center_stages (stage_id);

create table public.center_sectors (
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  sector_id smallint not null references public.sectors (id),
  primary key (center_id, sector_id)
);
create index center_sectors_sector_idx on public.center_sectors (sector_id);

create table public.center_services (
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  support_need_id smallint not null references public.support_needs (id),
  primary key (center_id, support_need_id)
);
create index center_services_need_idx on public.center_services (support_need_id);

create type public.staff_status as enum ('active', 'revoked');

create table public.center_staff_memberships (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  invited_email text check (char_length(invited_email) <= 254),
  status public.staff_status not null default 'active',
  invited_by uuid,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid,
  unique (center_id, user_id)
);
create index center_staff_user_idx on public.center_staff_memberships (user_id);

-- ===========================================================================
-- 6. Mentors, paid experts and their availability
-- ===========================================================================
create type public.engagement_policy as enum ('pre_admission', 'admitted_only', 'both');

create table public.center_experts (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  headline text check (char_length(headline) <= 150),
  organization text check (char_length(organization) <= 150),
  bio text check (char_length(bio) <= 3000),
  expertise_tags text[] not null default '{}' check (cardinality(expertise_tags) <= 15),
  engagement_policy public.engagement_policy not null default 'both',
  is_paid boolean not null default false,
  fee_inr integer check (fee_inr between 1 and 1000000),
  session_minutes smallint not null default 60 check (session_minutes between 15 and 480),
  offers_online boolean not null default true,
  offers_in_person boolean not null default false,
  in_person_location text check (char_length(in_person_location) <= 300),
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint center_experts_has_format check (offers_online or offers_in_person),
  constraint center_experts_paid_has_fee check (not is_paid or fee_inr is not null),
  constraint center_experts_free_has_no_fee check (is_paid or fee_inr is null),
  constraint center_experts_in_person_location check (not offers_in_person or in_person_location is not null)
);
create index center_experts_center_idx on public.center_experts (center_id);
create index center_experts_user_idx on public.center_experts (user_id);

create type public.invitation_kind as enum ('center_staff', 'expert');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  kind public.invitation_kind not null,
  center_id uuid not null references public.incubation_centers (id) on delete cascade,
  expert_id uuid references public.center_experts (id) on delete cascade,
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  status public.invitation_status not null default 'pending',
  invited_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_by uuid,
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint invitations_expert_target check ((kind = 'expert') = (expert_id is not null))
);
create index invitations_center_idx on public.invitations (center_id);
create index invitations_expert_idx on public.invitations (expert_id);
create index invitations_email_idx on public.invitations (email) where status = 'pending';

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.center_experts (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_cancelled boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint availability_slots_valid_range check (ends_at > starts_at and ends_at - starts_at <= interval '8 hours'),
  constraint availability_slots_no_overlap exclude using gist (
    expert_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (not is_cancelled)
);
create index availability_slots_expert_idx on public.availability_slots (expert_id, starts_at);

-- ===========================================================================
-- 7. Applications
-- ===========================================================================
create type public.application_status as enum (
  'draft', 'submitted', 'under_review', 'more_information_needed', 'accepted', 'rejected', 'waitlisted'
);

create table public.startup_applications (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete restrict,
  center_id uuid not null references public.incubation_centers (id) on delete restrict,
  founder_id uuid not null references public.profiles (id) on delete restrict,
  status public.application_status not null default 'draft',
  cover_note text check (char_length(cover_note) <= 3000),
  share_financials boolean not null default false,
  profile_snapshot jsonb,
  snapshot_taken_at timestamptz,
  founder_response text check (char_length(founder_response) <= 3000),
  submitted_at timestamptz,
  last_status_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, center_id)
);
create index startup_applications_center_idx on public.startup_applications (center_id, status);
create index startup_applications_founder_idx on public.startup_applications (founder_id);

create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.startup_applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  note text check (char_length(note) <= 3000),
  changed_by uuid,
  changed_by_side text not null check (changed_by_side in ('founder', 'center', 'system')),
  created_at timestamptz not null default now()
);
create index application_status_history_app_idx on public.application_status_history (application_id, created_at);

-- ===========================================================================
-- 8. Messages and reports
-- ===========================================================================
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.incubation_centers (id) on delete restrict,
  startup_id uuid not null references public.startups (id) on delete restrict,
  application_id uuid references public.startup_applications (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 150),
  started_by uuid,
  started_by_side text not null check (started_by_side in ('founder', 'center')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  founder_archived_at timestamptz,
  center_archived_at timestamptz,
  founder_last_read_at timestamptz,
  center_last_read_at timestamptz
);
create index message_threads_center_idx on public.message_threads (center_id, last_message_at desc);
create index message_threads_startup_idx on public.message_threads (startup_id, last_message_at desc);
create index message_threads_application_idx on public.message_threads (application_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid,
  sender_side text not null check (sender_side in ('founder', 'center')),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  hidden_at timestamptz,
  hidden_by uuid,
  hidden_reason text check (char_length(hidden_reason) <= 500)
);
create index messages_thread_idx on public.messages (thread_id, created_at);

create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  reporter_side text not null check (reporter_side in ('founder', 'center')),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 2000),
  status public.report_status not null default 'open',
  resolution_note text check (char_length(resolution_note) <= 2000),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_thread_idx on public.reports (thread_id);
create index reports_message_idx on public.reports (message_id);

-- ===========================================================================
-- 9. Consultation bookings (no payments are processed here)
-- ===========================================================================
create type public.booking_status as enum (
  'pending', 'payment_instructions_sent', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show'
);
create type public.session_format as enum ('online', 'in_person');

create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.center_experts (id) on delete restrict,
  center_id uuid not null references public.incubation_centers (id) on delete restrict,
  slot_id uuid not null references public.availability_slots (id) on delete restrict,
  startup_id uuid not null references public.startups (id) on delete restrict,
  founder_id uuid not null references public.profiles (id) on delete restrict,
  format public.session_format not null,
  status public.booking_status not null default 'pending',
  founder_note text check (char_length(founder_note) <= 2000),
  is_paid boolean not null,
  fee_inr integer,
  session_minutes smallint not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  payment_instructions text check (char_length(payment_instructions) <= 2000),
  expert_note text check (char_length(expert_note) <= 2000),
  meeting_link text check (char_length(meeting_link) <= 500 and meeting_link ~* '^https?://'),
  meeting_location text check (char_length(meeting_location) <= 300),
  proposed_slot_id uuid references public.availability_slots (id) on delete set null,
  proposed_note text check (char_length(proposed_note) <= 1000),
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consultation_bookings_expert_idx on public.consultation_bookings (expert_id, status);
create index consultation_bookings_center_idx on public.consultation_bookings (center_id, status);
create index consultation_bookings_founder_idx on public.consultation_bookings (founder_id);
create index consultation_bookings_startup_idx on public.consultation_bookings (startup_id);
create index consultation_bookings_proposed_idx on public.consultation_bookings (proposed_slot_id);
-- A time slot can hold only one live request: this is what prevents double booking.
create unique index consultation_bookings_one_live_per_slot on public.consultation_bookings (slot_id)
  where status in ('pending', 'payment_instructions_sent', 'confirmed');

create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.consultation_bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  note text check (char_length(note) <= 2000),
  actor_id uuid,
  actor_side text not null check (actor_side in ('founder', 'expert')),
  created_at timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- ===========================================================================
-- 10. Notifications and audit log
-- ===========================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (char_length(kind) <= 60),
  title text not null check (char_length(title) <= 200),
  body text check (char_length(body) <= 1000),
  link text check (char_length(link) <= 300 and link ~ '^/'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (char_length(action) <= 80),
  entity_type text check (char_length(entity_type) <= 60),
  entity_id text check (char_length(entity_id) <= 80),
  center_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

-- ===========================================================================
-- 11. updated_at triggers
-- ===========================================================================
create trigger founder_profiles_updated_at before update on public.founder_profiles
  for each row execute function public.set_updated_at();
create trigger incubation_centers_updated_at before update on public.incubation_centers
  for each row execute function public.set_updated_at();
create trigger center_experts_updated_at before update on public.center_experts
  for each row execute function public.set_updated_at();
create trigger startup_applications_updated_at before update on public.startup_applications
  for each row execute function public.set_updated_at();
create trigger consultation_bookings_updated_at before update on public.consultation_bookings
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 12. Role helpers (used by RLS policies and functions)
-- ===========================================================================
create or replace function private.current_user_is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and not is_suspended);
$$;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = (select auth.uid()) and r.role = 'platform_admin' and not p.is_suspended
  );
$$;

create or replace function private.is_center_staff(p_center_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.center_staff_memberships m
    join public.profiles p on p.id = m.user_id
    where m.center_id = p_center_id and m.user_id = (select auth.uid())
      and m.status = 'active' and not p.is_suspended
  );
$$;

-- Staff of at least one active centre. They may browse every startup profile.
create or replace function private.is_active_center_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.center_staff_memberships m
    join public.incubation_centers c on c.id = m.center_id
    join public.profiles p on p.id = m.user_id
    where m.user_id = (select auth.uid()) and m.status = 'active'
      and c.status = 'active' and not p.is_suspended
  );
$$;

create or replace function private.is_startup_owner(p_startup_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.startups where id = p_startup_id and owner_id = (select auth.uid()));
$$;

create or replace function private.can_manage_expert(p_expert_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.center_experts e
    where e.id = p_expert_id
      and (
        private.is_center_staff(e.center_id)
        or (e.user_id = (select auth.uid()) and private.current_user_is_active())
      )
  );
$$;

-- A linked mentor or expert can see the name of a startup that asked them for a session.
create or replace function private.is_booking_expert_for(p_startup_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.consultation_bookings b
    join public.center_experts e on e.id = b.expert_id
    where b.startup_id = p_startup_id and e.user_id = (select auth.uid())
      and private.current_user_is_active()
  );
$$;

create or replace function private.shares_center_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.center_staff_memberships mine
    join public.center_staff_memberships theirs on theirs.center_id = mine.center_id
    where mine.user_id = (select auth.uid()) and mine.status = 'active' and theirs.user_id = p_user_id
  );
$$;

create or replace function private.is_thread_participant(p_thread_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.message_threads t
    where t.id = p_thread_id
      and (private.is_startup_owner(t.startup_id) or private.is_center_staff(t.center_id))
  );
$$;

create or replace function private.is_admitted(p_startup_id uuid, p_center_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.startup_applications
    where startup_id = p_startup_id and center_id = p_center_id and status = 'accepted'
  );
$$;

-- Internal helpers used by the workflow functions below.
create or replace function private.audit(p_action text, p_entity_type text, p_entity_id text, p_center_id uuid, p_details jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, center_id, details)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, p_center_id, coalesce(p_details, '{}'::jsonb));
$$;

create or replace function private.notify(p_user_id uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p_user_id, p_kind, left(p_title, 200), left(p_body, 1000), p_link
  where p_user_id is not null;
$$;

create or replace function private.notify_center_staff(p_center_id uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select m.user_id, p_kind, left(p_title, 200), left(p_body, 1000), p_link
  from public.center_staff_memberships m
  where m.center_id = p_center_id and m.status = 'active'
    and m.user_id is distinct from (select auth.uid());
$$;

create or replace function private.notify_admins(p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select r.user_id, p_kind, left(p_title, 200), left(p_body, 1000), p_link
  from public.user_roles r
  where r.role = 'platform_admin';
$$;

create or replace function private.center_open_for_applications(p_center_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.incubation_centers
    where id = p_center_id and status = 'active' and accepting_applications
      and (applications_close_on is null or applications_close_on >= (now() at time zone 'Asia/Kolkata')::date)
  );
$$;

create or replace function private.require_active_user()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if not private.current_user_is_active() then
    raise exception 'account_suspended' using errcode = '42501';
  end if;
end;
$$;

-- ===========================================================================
-- 13. Automatic rows and guards
-- ===========================================================================

-- New account: create the profile. Founders who register through the founder form
-- also get a founder profile with their self-declared domicile and consent.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(nullif(trim(meta ->> 'full_name'), ''), 120));

  if coalesce(meta ->> 'account_type', 'founder') = 'founder' then
    insert into public.founder_profiles (user_id, phone, district, city, domicile_declared, consent_given)
    values (
      new.id,
      left(nullif(trim(meta ->> 'phone'), ''), 20),
      left(nullif(trim(meta ->> 'district'), ''), 60),
      left(nullif(trim(meta ->> 'city'), ''), 80),
      coalesce(meta ->> 'domicile_declared', '') = 'true',
      coalesce(meta ->> 'consent_given', '') = 'true'
    );
  end if;

  return new;
end;
$$;

-- Timestamps for the domicile declaration and consent are set by the database, not the browser.
create or replace function private.stamp_founder_declarations()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.domicile_declared and (tg_op = 'INSERT' or not old.domicile_declared) then
    new.domicile_declared_at := now();
  elsif not new.domicile_declared then
    new.domicile_declared_at := null;
  else
    new.domicile_declared_at := old.domicile_declared_at;
  end if;

  if new.consent_given and (tg_op = 'INSERT' or not old.consent_given) then
    new.consent_given_at := now();
  elsif not new.consent_given then
    new.consent_given_at := null;
  else
    new.consent_given_at := old.consent_given_at;
  end if;
  return new;
end;
$$;

create trigger founder_profiles_stamp before insert or update on public.founder_profiles
  for each row execute function private.stamp_founder_declarations();

-- Having a founder profile is what makes someone a founder.
create or replace function private.grant_founder_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role) values (new.user_id, 'founder')
  on conflict do nothing;
  return new;
end;
$$;

create trigger founder_profiles_role after insert on public.founder_profiles
  for each row execute function private.grant_founder_role();

-- Keep user_roles in step with centre memberships and expert links.
create or replace function private.sync_role(p_user_id uuid, p_role public.platform_role, p_has boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user_id is null then
    return;
  end if;
  if p_has then
    insert into public.user_roles (user_id, role) values (p_user_id, p_role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  end if;
end;
$$;

create or replace function private.sync_staff_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
begin
  perform private.sync_role(
    uid,
    'center_staff',
    exists (select 1 from public.center_staff_memberships where user_id = uid and status = 'active')
  );
  return null;
end;
$$;

create trigger center_staff_role_sync after insert or update or delete on public.center_staff_memberships
  for each row execute function private.sync_staff_role();

create or replace function private.sync_expert_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.user_id is not null then
    perform private.sync_role(old.user_id, 'expert', exists (select 1 from public.center_experts where user_id = old.user_id));
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.user_id is not null then
    perform private.sync_role(new.user_id, 'expert', true);
  end if;
  return null;
end;
$$;

create trigger center_experts_role_sync after insert or update of user_id or delete on public.center_experts
  for each row execute function private.sync_expert_role();

-- Centre staff can edit their centre's profile, but only the master admin changes
-- its status, slug or sample flag.
create or replace function private.guard_center_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not private.is_platform_admin() then
    if new.status is distinct from old.status
      or new.status_reason is distinct from old.status_reason
      or new.slug is distinct from old.slug
      or new.is_sample is distinct from old.is_sample
      or new.created_by is distinct from old.created_by then
      raise exception 'admin_only_fields' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger incubation_centers_guard before update on public.incubation_centers
  for each row execute function private.guard_center_admin_fields();

-- Audit centre lifecycle changes.
create or replace function private.audit_center_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('center.created', 'center', new.id::text, new.id, jsonb_build_object('name', new.name, 'status', new.status));
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      perform private.audit(
        case new.status when 'active' then 'center.activated' when 'suspended' then 'center.suspended' else 'center.archived' end,
        'center', new.id::text, new.id,
        jsonb_build_object('from', old.status, 'to', new.status, 'reason', new.status_reason)
      );
      perform private.notify_center_staff(
        new.id, 'center.status',
        'Centre status changed to ' || new.status,
        coalesce(new.status_reason, 'The platform administrator changed this centre''s status.'),
        '/manage/' || new.slug
      );
    end if;
  elsif tg_op = 'DELETE' then
    perform private.audit('center.deleted', 'center', old.id::text, null, jsonb_build_object('name', old.name));
  end if;
  return null;
end;
$$;

create trigger incubation_centers_audit after insert or update or delete on public.incubation_centers
  for each row execute function private.audit_center_changes();

-- Linking an expert profile to an account only happens by accepting an invitation.
-- Linked experts may edit their own profile but not move it, relink it or switch it on or off.
create or replace function private.guard_expert_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' and new.user_id is not null then
      raise exception 'expert_link_requires_invitation' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' then
      if new.user_id is not null and new.user_id is distinct from old.user_id then
        raise exception 'expert_link_requires_invitation' using errcode = '42501';
      end if;
      if new.center_id is distinct from old.center_id then
        raise exception 'expert_centre_locked' using errcode = '42501';
      end if;
      if not (private.is_center_staff(old.center_id) or private.is_platform_admin())
        and (new.is_active is distinct from old.is_active or new.user_id is distinct from old.user_id) then
        raise exception 'staff_only_fields' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger center_experts_guard before insert or update on public.center_experts
  for each row execute function private.guard_expert_fields();

-- Slots: only future times; a slot holding a live request can't be changed or removed.
create or replace function private.guard_slots()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.starts_at <= now() then
      raise exception 'slot_in_past' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if exists (
    select 1 from public.consultation_bookings b
    where b.slot_id = old.id and b.status in ('pending', 'payment_instructions_sent', 'confirmed')
  ) then
    raise exception 'slot_has_booking' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' then
    if new.expert_id is distinct from old.expert_id then
      raise exception 'slot_expert_locked' using errcode = '42501';
    end if;
    if (new.starts_at, new.ends_at) is distinct from (old.starts_at, old.ends_at) and new.starts_at <= now() then
      raise exception 'slot_in_past' using errcode = 'P0001';
    end if;
    return new;
  end if;
  return old;
end;
$$;

create trigger availability_slots_guard before insert or update or delete on public.availability_slots
  for each row execute function private.guard_slots();

-- ===========================================================================
-- 14. Row Level Security
-- ===========================================================================
alter table public.startup_stages enable row level security;
alter table public.support_needs enable row level security;
alter table public.founder_profiles enable row level security;
alter table public.startup_sectors enable row level security;
alter table public.startup_support_needs enable row level security;
alter table public.startup_member_contacts enable row level security;
alter table public.incubation_centers enable row level security;
alter table public.center_stages enable row level security;
alter table public.center_sectors enable row level security;
alter table public.center_services enable row level security;
alter table public.center_staff_memberships enable row level security;
alter table public.center_experts enable row level security;
alter table public.invitations enable row level security;
alter table public.availability_slots enable row level security;
alter table public.startup_applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Signed-out visitors may only read the public directory: taxonomy, active centres and their experts.
revoke all on
  public.founder_profiles, public.startup_sectors, public.startup_support_needs, public.startup_member_contacts,
  public.center_staff_memberships, public.invitations, public.availability_slots, public.startup_applications,
  public.application_status_history, public.message_threads, public.messages, public.reports,
  public.consultation_bookings, public.booking_events, public.notifications, public.audit_logs,
  public.startups
from anon;

-- Columns the browser may never write directly. Workflow functions write them instead.
revoke insert, update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke insert, update, delete on public.user_roles from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- profiles: yourself, colleagues at your centre, and admins
create policy "Read own, colleague or any profile as admin" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_platform_admin())
    or (select private.shares_center_with(id))
  );

create policy "Update own name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and (select private.current_user_is_active()))
  with check (id = (select auth.uid()));

-- user_roles: read-only in the app
create policy "Read own roles or all as admin" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_platform_admin()));

-- taxonomy: everyone reads, admins edit
create policy "Anyone reads stages" on public.startup_stages for select to anon, authenticated using (true);
create policy "Admins add stages" on public.startup_stages for insert to authenticated with check ((select private.is_platform_admin()));
create policy "Admins edit stages" on public.startup_stages for update to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy "Admins delete stages" on public.startup_stages for delete to authenticated using ((select private.is_platform_admin()));

create policy "Anyone reads sectors" on public.sectors for select to anon, authenticated using (true);
create policy "Admins add sectors" on public.sectors for insert to authenticated with check ((select private.is_platform_admin()));
create policy "Admins edit sectors" on public.sectors for update to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy "Admins delete sectors" on public.sectors for delete to authenticated using ((select private.is_platform_admin()));

create policy "Anyone reads support needs" on public.support_needs for select to anon, authenticated using (true);
create policy "Admins add support needs" on public.support_needs for insert to authenticated with check ((select private.is_platform_admin()));
create policy "Admins edit support needs" on public.support_needs for update to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy "Admins delete support needs" on public.support_needs for delete to authenticated using ((select private.is_platform_admin()));

-- founder_profiles: the founder only (admins see whether domicile was declared)
create policy "Founder reads own details" on public.founder_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_platform_admin()));
create policy "Founder creates own details" on public.founder_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.current_user_is_active()));
create policy "Founder edits own details" on public.founder_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) and (select private.current_user_is_active()))
  with check (user_id = (select auth.uid()));

-- startups: the founder, staff of active centres and admins can read; only the founder edits
create policy "Founder, centre staff and admins read startups" on public.startups
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select private.is_active_center_staff())
    or (select private.is_platform_admin())
    or private.is_booking_expert_for(id)
  );
create policy "Founder creates own startup" on public.startups
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.current_user_is_active()));
create policy "Founder edits own startup" on public.startups
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.current_user_is_active()))
  with check (owner_id = (select auth.uid()));
create policy "Founder deletes own startup" on public.startups
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- startup sectors and support needs follow the startup
create policy "Read startup sectors" on public.startup_sectors
  for select to authenticated
  using ((select private.is_startup_owner(startup_id)) or (select private.is_active_center_staff()) or (select private.is_platform_admin()));
create policy "Founder adds startup sectors" on public.startup_sectors
  for insert to authenticated
  with check ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()));
create policy "Founder removes startup sectors" on public.startup_sectors
  for delete to authenticated
  using ((select private.is_startup_owner(startup_id)));

create policy "Read startup support needs" on public.startup_support_needs
  for select to authenticated
  using ((select private.is_startup_owner(startup_id)) or (select private.is_active_center_staff()) or (select private.is_platform_admin()));
create policy "Founder adds support needs" on public.startup_support_needs
  for insert to authenticated
  with check ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()));
create policy "Founder removes support needs" on public.startup_support_needs
  for delete to authenticated
  using ((select private.is_startup_owner(startup_id)));

-- team members
create policy "Read team members" on public.startup_members
  for select to authenticated
  using ((select private.is_startup_owner(startup_id)) or (select private.is_active_center_staff()) or (select private.is_platform_admin()));
create policy "Founder adds team members" on public.startup_members
  for insert to authenticated
  with check ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()));
create policy "Founder edits team members" on public.startup_members
  for update to authenticated
  using ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()))
  with check ((select private.is_startup_owner(startup_id)));
create policy "Founder removes team members" on public.startup_members
  for delete to authenticated
  using ((select private.is_startup_owner(startup_id)));

create policy "Founder reads team contacts" on public.startup_member_contacts
  for select to authenticated
  using (exists (select 1 from public.startup_members m where m.id = member_id and private.is_startup_owner(m.startup_id)));
create policy "Founder adds team contacts" on public.startup_member_contacts
  for insert to authenticated
  with check (exists (select 1 from public.startup_members m where m.id = member_id and private.is_startup_owner(m.startup_id)));
create policy "Founder edits team contacts" on public.startup_member_contacts
  for update to authenticated
  using (exists (select 1 from public.startup_members m where m.id = member_id and private.is_startup_owner(m.startup_id)))
  with check (exists (select 1 from public.startup_members m where m.id = member_id and private.is_startup_owner(m.startup_id)));
create policy "Founder removes team contacts" on public.startup_member_contacts
  for delete to authenticated
  using (exists (select 1 from public.startup_members m where m.id = member_id and private.is_startup_owner(m.startup_id)));

-- financial figures: the founder only, never centres or admins (shared with a centre only
-- inside an application snapshot, when the founder ticks the box)
create policy "Founder reads own financials" on public.startup_financials
  for select to authenticated using ((select private.is_startup_owner(startup_id)));
create policy "Founder adds own financials" on public.startup_financials
  for insert to authenticated with check ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()));
create policy "Founder edits own financials" on public.startup_financials
  for update to authenticated
  using ((select private.is_startup_owner(startup_id)) and (select private.current_user_is_active()))
  with check ((select private.is_startup_owner(startup_id)));
create policy "Founder deletes own financials" on public.startup_financials
  for delete to authenticated using ((select private.is_startup_owner(startup_id)));

-- incubation centres
create policy "Visitors read active centres" on public.incubation_centers
  for select to anon using (status = 'active');
create policy "Signed-in users read centres" on public.incubation_centers
  for select to authenticated
  using (status <> 'archived' or (select private.is_platform_admin()) or (select private.is_center_staff(id))
    or exists (select 1 from public.startup_applications a where a.center_id = incubation_centers.id and a.founder_id = (select auth.uid())));
create policy "Admins create centres" on public.incubation_centers
  for insert to authenticated with check ((select private.is_platform_admin()));
create policy "Staff and admins edit centres" on public.incubation_centers
  for update to authenticated
  using ((select private.is_platform_admin()) or ((select private.is_center_staff(id)) and status <> 'archived'))
  with check ((select private.is_platform_admin()) or (select private.is_center_staff(id)));
create policy "Admins delete centres" on public.incubation_centers
  for delete to authenticated using ((select private.is_platform_admin()));

create policy "Anyone reads centre stages" on public.center_stages for select to anon, authenticated using (true);
create policy "Staff and admins add centre stages" on public.center_stages for insert to authenticated
  with check ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));
create policy "Staff and admins remove centre stages" on public.center_stages for delete to authenticated
  using ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));

create policy "Anyone reads centre sectors" on public.center_sectors for select to anon, authenticated using (true);
create policy "Staff and admins add centre sectors" on public.center_sectors for insert to authenticated
  with check ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));
create policy "Staff and admins remove centre sectors" on public.center_sectors for delete to authenticated
  using ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));

create policy "Anyone reads centre services" on public.center_services for select to anon, authenticated using (true);
create policy "Staff and admins add centre services" on public.center_services for insert to authenticated
  with check ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));
create policy "Staff and admins remove centre services" on public.center_services for delete to authenticated
  using ((select private.is_platform_admin()) or (select private.is_center_staff(center_id)));

-- staff memberships: written only by the invitation and admin functions
create policy "Read own, colleague or all memberships as admin" on public.center_staff_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_center_staff(center_id)) or (select private.is_platform_admin()));

-- experts
create policy "Visitors read active experts" on public.center_experts
  for select to anon
  using (is_active and exists (select 1 from public.incubation_centers c where c.id = center_experts.center_id and c.status = 'active'));
create policy "Signed-in users read experts" on public.center_experts
  for select to authenticated
  using (
    (is_active and exists (select 1 from public.incubation_centers c where c.id = center_experts.center_id and c.status = 'active'))
    or user_id = (select auth.uid())
    or (select private.is_center_staff(center_id))
    or (select private.is_platform_admin())
  );
create policy "Staff add experts" on public.center_experts
  for insert to authenticated
  with check ((select private.is_center_staff(center_id)) or (select private.is_platform_admin()));
create policy "Staff and the expert edit expert profiles" on public.center_experts
  for update to authenticated
  using ((select private.can_manage_expert(id)) or (select private.is_platform_admin()))
  with check ((select private.can_manage_expert(id)) or (select private.is_platform_admin()));
create policy "Staff remove experts" on public.center_experts
  for delete to authenticated
  using ((select private.is_center_staff(center_id)) or (select private.is_platform_admin()));

-- invitations: admins, staff of the centre (expert invitations) and the invited person
create policy "Read invitations" on public.invitations
  for select to authenticated
  using (
    (select private.is_platform_admin())
    or (kind = 'expert' and (select private.is_center_staff(center_id)))
    or (status = 'pending' and email = lower((select auth.jwt()) ->> 'email'))
  );

-- availability slots: managed by centre staff and the linked expert. Founders see open
-- slots through public.available_slots(), which hides who booked what.
create policy "Managers read slots" on public.availability_slots
  for select to authenticated using ((select private.can_manage_expert(expert_id)));
create policy "Managers add slots" on public.availability_slots
  for insert to authenticated with check ((select private.can_manage_expert(expert_id)));
create policy "Managers edit slots" on public.availability_slots
  for update to authenticated
  using ((select private.can_manage_expert(expert_id)))
  with check ((select private.can_manage_expert(expert_id)));
create policy "Managers remove slots" on public.availability_slots
  for delete to authenticated using ((select private.can_manage_expert(expert_id)));

-- applications: the founder and the centre's staff (never drafts). Written by functions.
create policy "Founder and centre staff read applications" on public.startup_applications
  for select to authenticated
  using (
    founder_id = (select auth.uid())
    or (status <> 'draft' and (select private.is_center_staff(center_id)))
  );
create policy "Founder deletes own draft" on public.startup_applications
  for delete to authenticated
  using (founder_id = (select auth.uid()) and status = 'draft');

create policy "Read application history" on public.application_status_history
  for select to authenticated
  using (exists (
    select 1 from public.startup_applications a
    where a.id = application_id
      and (a.founder_id = (select auth.uid()) or (a.status <> 'draft' and private.is_center_staff(a.center_id)))
  ));

-- messages: participants and admins (for moderation). Written by functions.
create policy "Participants and admins read threads" on public.message_threads
  for select to authenticated
  using ((select private.is_thread_participant(id)) or (select private.is_platform_admin()));

create policy "Participants and admins read messages" on public.messages
  for select to authenticated
  using (
    (hidden_at is null and (select private.is_thread_participant(thread_id)))
    or (select private.is_platform_admin())
  );

create policy "Reporters and admins read reports" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_platform_admin()));

-- bookings: the founder and whoever manages the expert. Written by functions.
create policy "Founder and expert managers read bookings" on public.consultation_bookings
  for select to authenticated
  using (founder_id = (select auth.uid()) or (select private.can_manage_expert(expert_id)));

create policy "Read booking events" on public.booking_events
  for select to authenticated
  using (exists (
    select 1 from public.consultation_bookings b
    where b.id = booking_id and (b.founder_id = (select auth.uid()) or private.can_manage_expert(b.expert_id))
  ));

-- notifications: your own
create policy "Read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Mark own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- audit log: admins only
create policy "Admins read the audit log" on public.audit_logs
  for select to authenticated using ((select private.is_platform_admin()));

-- ===========================================================================
-- 15. Profile completeness and application snapshots
-- ===========================================================================

-- What is still missing before this startup can formally apply. Empty array = ready.
create or replace function public.startup_profile_gaps(p_startup_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.startups%rowtype;
  fp public.founder_profiles%rowtype;
  founder_name text;
  gaps text[] := '{}'::text[];
begin
  if not (private.is_startup_owner(p_startup_id) or private.is_platform_admin()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into s from public.startups where id = p_startup_id;
  select full_name into founder_name from public.profiles where id = s.owner_id;
  select * into fp from public.founder_profiles where user_id = s.owner_id;

  if coalesce(trim(founder_name), '') = '' then gaps := gaps || 'Your full name'::text; end if;
  if coalesce(trim(fp.phone), '') = '' then gaps := gaps || 'Your phone number'::text; end if;
  if coalesce(trim(fp.district), '') = '' then gaps := gaps || 'Your district'::text; end if;
  if not coalesce(fp.domicile_declared, false) then gaps := gaps || 'Jammu domicile self-declaration'::text; end if;
  if not coalesce(fp.consent_given, false) then gaps := gaps || 'Consent to share your profile with centres'::text; end if;
  if coalesce(trim(s.description), '') = '' then gaps := gaps || 'Short description'::text; end if;
  if s.stage_id is null then gaps := gaps || 'Startup stage'::text; end if;
  if not exists (select 1 from public.startup_sectors where startup_id = s.id) then gaps := gaps || 'At least one sector'::text; end if;
  if coalesce(trim(s.problem), '') = '' then gaps := gaps || 'The problem you are solving'::text; end if;
  if coalesce(trim(s.solution), '') = '' then gaps := gaps || 'Your solution'::text; end if;
  if coalesce(trim(s.target_customers), '') = '' then gaps := gaps || 'Your target customers'::text; end if;
  if not exists (select 1 from public.startup_members where startup_id = s.id) then gaps := gaps || 'Team details'::text; end if;
  if not exists (select 1 from public.startup_support_needs where startup_id = s.id) then gaps := gaps || 'At least one support need'::text; end if;

  return gaps;
end;
$$;

-- A copy of the profile as it stood when the founder applied. Contact details are
-- included only if the founder chose to share them; financial figures only if ticked.
create or replace function private.build_startup_snapshot(p_startup_id uuid, p_include_financials boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'startup', jsonb_build_object(
      'name', s.name,
      'description', s.description,
      'founding_year', s.founding_year,
      'stage', st.name,
      'stage_code', st.code,
      'problem', s.problem,
      'solution', s.solution,
      'target_customers', s.target_customers,
      'offering_type', s.offering_type,
      'domain', s.domain,
      'district', s.district,
      'city', s.city,
      'state', s.state,
      'legal_status', s.legal_status,
      'registration_number', s.registration_number,
      'dpiit_recognised', s.dpiit_recognised,
      'traction_level', s.traction_level,
      'traction_summary', s.traction_summary,
      'website', s.website,
      'pitch_deck_url', s.pitch_deck_url,
      'demo_url', s.demo_url
    ),
    'sectors', coalesce((
      select jsonb_agg(sec.name order by sec.name)
      from public.startup_sectors ss join public.sectors sec on sec.id = ss.sector_id
      where ss.startup_id = s.id
    ), '[]'::jsonb),
    'support_needs', coalesce((
      select jsonb_agg(n.name order by n.sort_order)
      from public.startup_support_needs sn join public.support_needs n on n.id = sn.support_need_id
      where sn.startup_id = s.id
    ), '[]'::jsonb),
    'team', coalesce((
      select jsonb_agg(jsonb_build_object(
        'full_name', m.full_name, 'role_title', m.role_title, 'is_founder', m.is_founder, 'linkedin_url', m.linkedin_url
      ) order by m.is_founder desc, m.created_at)
      from public.startup_members m where m.startup_id = s.id
    ), '[]'::jsonb),
    'founder', jsonb_build_object(
      'full_name', p.full_name,
      'district', fp.district,
      'city', fp.city,
      'domicile_self_declared', coalesce(fp.domicile_declared, false),
      'contact', case when fp.share_contact_with_centres
        then jsonb_build_object('email', u.email, 'phone', fp.phone) end
    ),
    'financials', case when p_include_financials then (
      select jsonb_build_object(
        'as_of_date', f.as_of_date,
        'currency', f.currency,
        'annual_revenue', f.annual_revenue,
        'monthly_operating_expenses', f.monthly_operating_expenses,
        'cash_balance', f.cash_balance,
        'total_funding_received', f.total_funding_received,
        'monthly_burn_rate', f.monthly_burn_rate,
        'cash_runway_months', f.cash_runway_months
      )
      from public.startup_financials f where f.startup_id = s.id
      order by f.as_of_date desc limit 1
    ) end
  )
  from public.startups s
  join public.profiles p on p.id = s.owner_id
  left join public.startup_stages st on st.id = s.stage_id
  left join public.founder_profiles fp on fp.user_id = s.owner_id
  left join auth.users u on u.id = s.owner_id
  where s.id = p_startup_id;
$$;

-- Founder contact details for centre staff: returned only when the founder opted in.
create or replace function public.startup_contact(p_startup_id uuid)
returns table (shared boolean, email text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_active_center_staff() or private.is_startup_owner(p_startup_id)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select fp.share_contact_with_centres,
      case when fp.share_contact_with_centres then u.email::text end,
      case when fp.share_contact_with_centres then fp.phone end
    from public.startups s
    join public.founder_profiles fp on fp.user_id = s.owner_id
    join auth.users u on u.id = s.owner_id
    where s.id = p_startup_id;
end;
$$;

-- ===========================================================================
-- 16. Application workflow
-- ===========================================================================

-- Start (or resume) an application to a centre. One application per startup per centre.
create or replace function public.start_application(p_center_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_startup uuid;
  v_app uuid;
  v_status public.center_status;
begin
  perform private.require_active_user();

  select id into v_startup from public.startups where owner_id = (select auth.uid());
  if v_startup is null then
    raise exception 'no_startup' using errcode = 'P0001';
  end if;

  select id into v_app from public.startup_applications where startup_id = v_startup and center_id = p_center_id;
  if v_app is not null then
    return v_app;
  end if;

  select status into v_status from public.incubation_centers where id = p_center_id;
  if v_status is null or v_status = 'archived' then
    raise exception 'centre_not_found' using errcode = 'P0001';
  end if;
  if v_status = 'suspended' then
    raise exception 'centre_suspended' using errcode = 'P0001';
  end if;
  if not private.center_open_for_applications(p_center_id) then
    raise exception 'not_accepting' using errcode = 'P0001';
  end if;

  insert into public.startup_applications (startup_id, center_id, founder_id)
  values (v_startup, p_center_id, (select auth.uid()))
  on conflict (startup_id, center_id) do nothing
  returning id into v_app;

  if v_app is null then
    select id into v_app from public.startup_applications where startup_id = v_startup and center_id = p_center_id;
  end if;
  return v_app;
end;
$$;

create or replace function public.save_application_draft(p_application_id uuid, p_cover_note text, p_share_financials boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();
  update public.startup_applications
  set cover_note = nullif(trim(p_cover_note), ''), share_financials = coalesce(p_share_financials, false)
  where id = p_application_id and founder_id = (select auth.uid()) and status = 'draft';
  if not found then
    raise exception 'not_editable' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.submit_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.startup_applications%rowtype;
  c public.incubation_centers%rowtype;
  gaps text[];
  v_startup_name text;
begin
  perform private.require_active_user();

  select * into a from public.startup_applications where id = p_application_id for update;
  if not found or a.founder_id <> (select auth.uid()) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if a.status <> 'draft' then
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;

  select * into c from public.incubation_centers where id = a.center_id;
  if c.status = 'suspended' then
    raise exception 'centre_suspended' using errcode = 'P0001';
  end if;
  if not private.center_open_for_applications(a.center_id) then
    raise exception 'not_accepting' using errcode = 'P0001';
  end if;

  gaps := public.startup_profile_gaps(a.startup_id);
  if cardinality(gaps) > 0 then
    raise exception 'profile_incomplete' using errcode = 'P0001', detail = array_to_string(gaps, '; ');
  end if;

  update public.startup_applications
  set status = 'submitted',
      submitted_at = now(),
      last_status_at = now(),
      profile_snapshot = private.build_startup_snapshot(a.startup_id, a.share_financials),
      snapshot_taken_at = now()
  where id = a.id;

  insert into public.application_status_history (application_id, from_status, to_status, changed_by, changed_by_side)
  values (a.id, 'draft', 'submitted', (select auth.uid()), 'founder');

  select name into v_startup_name from public.startups where id = a.startup_id;
  perform private.audit('application.submitted', 'application', a.id::text, a.center_id, jsonb_build_object('to', 'submitted'));
  perform private.notify_center_staff(
    a.center_id, 'application.submitted', 'New application from ' || v_startup_name,
    v_startup_name || ' applied to ' || c.name || '.',
    '/manage/' || c.slug || '/applications/' || a.id
  );
end;
$$;

-- The founder answers a "more information needed" request. The profile copy is refreshed.
create or replace function public.respond_to_information_request(p_application_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.startup_applications%rowtype;
  c public.incubation_centers%rowtype;
begin
  perform private.require_active_user();
  if coalesce(trim(p_response), '') = '' then
    raise exception 'response_required' using errcode = 'P0001';
  end if;

  select * into a from public.startup_applications where id = p_application_id for update;
  if not found or a.founder_id <> (select auth.uid()) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if a.status <> 'more_information_needed' then
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;

  select * into c from public.incubation_centers where id = a.center_id;
  if c.status <> 'active' then
    raise exception 'centre_suspended' using errcode = 'P0001';
  end if;

  update public.startup_applications
  set status = 'under_review',
      founder_response = left(trim(p_response), 3000),
      last_status_at = now(),
      profile_snapshot = private.build_startup_snapshot(a.startup_id, a.share_financials),
      snapshot_taken_at = now()
  where id = a.id;

  insert into public.application_status_history (application_id, from_status, to_status, note, changed_by, changed_by_side)
  values (a.id, 'more_information_needed', 'under_review', left(trim(p_response), 3000), (select auth.uid()), 'founder');

  perform private.audit('application.status_changed', 'application', a.id::text, a.center_id,
    jsonb_build_object('from', 'more_information_needed', 'to', 'under_review', 'by', 'founder'));
  perform private.notify_center_staff(
    a.center_id, 'application.response', 'A founder replied to your request',
    'The founder sent the information you asked for.',
    '/manage/' || c.slug || '/applications/' || a.id
  );
end;
$$;

-- Centre staff move an application forward. Every change is recorded.
create or replace function public.change_application_status(p_application_id uuid, p_status public.application_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.startup_applications%rowtype;
  c public.incubation_centers%rowtype;
  allowed public.application_status[];
  v_note text := nullif(left(trim(coalesce(p_note, '')), 3000), '');
  v_title text;
begin
  perform private.require_active_user();

  select * into a from public.startup_applications where id = p_application_id for update;
  if not found or a.status = 'draft' then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not private.is_center_staff(a.center_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  allowed := case a.status
    when 'submitted' then array['under_review', 'more_information_needed', 'accepted', 'rejected', 'waitlisted']::public.application_status[]
    when 'under_review' then array['more_information_needed', 'accepted', 'rejected', 'waitlisted']::public.application_status[]
    when 'more_information_needed' then array['under_review', 'accepted', 'rejected', 'waitlisted']::public.application_status[]
    when 'waitlisted' then array['under_review', 'accepted', 'rejected']::public.application_status[]
    else array[]::public.application_status[]
  end;
  if not (p_status = any (allowed)) then
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;
  if p_status = 'more_information_needed' and v_note is null then
    raise exception 'note_required' using errcode = 'P0001';
  end if;

  update public.startup_applications
  set status = p_status,
      last_status_at = now(),
      decided_at = case when p_status in ('accepted', 'rejected') then now() else decided_at end
  where id = a.id;

  insert into public.application_status_history (application_id, from_status, to_status, note, changed_by, changed_by_side)
  values (a.id, a.status, p_status, v_note, (select auth.uid()), 'center');

  select * into c from public.incubation_centers where id = a.center_id;
  perform private.audit('application.status_changed', 'application', a.id::text, a.center_id,
    jsonb_build_object('from', a.status, 'to', p_status, 'by', 'center'));

  v_title := case p_status
    when 'under_review' then c.name || ' is reviewing your application'
    when 'more_information_needed' then c.name || ' needs more information'
    when 'accepted' then c.name || ' accepted your application'
    when 'rejected' then c.name || ' made a decision on your application'
    when 'waitlisted' then c.name || ' put your application on the waitlist'
    else 'Your application was updated'
  end;
  perform private.notify(a.founder_id, 'application.status', v_title, v_note, '/applications/' || a.id);
end;
$$;

-- ===========================================================================
-- 17. Messaging workflow
-- ===========================================================================

-- Start a conversation. Centre staff may write to any startup; founders may write to a
-- centre about an application they have submitted there.
create or replace function public.start_thread(
  p_center_id uuid, p_startup_id uuid, p_subject text, p_body text, p_application_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_side text;
  v_thread uuid;
  c public.incubation_centers%rowtype;
  v_owner uuid;
  v_startup_name text;
begin
  perform private.require_active_user();
  if coalesce(trim(p_subject), '') = '' or coalesce(trim(p_body), '') = '' then
    raise exception 'message_required' using errcode = 'P0001';
  end if;

  select * into c from public.incubation_centers where id = p_center_id;
  select owner_id, name into v_owner, v_startup_name from public.startups where id = p_startup_id;
  if c.id is null or v_owner is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  if private.is_center_staff(p_center_id) then
    v_side := 'center';
  elsif v_owner = (select auth.uid()) then
    v_side := 'founder';
    if p_application_id is null or not exists (
      select 1 from public.startup_applications
      where id = p_application_id and startup_id = p_startup_id and center_id = p_center_id and status <> 'draft'
    ) then
      raise exception 'founder_needs_application' using errcode = 'P0001';
    end if;
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if c.status <> 'active' then
    raise exception 'centre_suspended' using errcode = 'P0001';
  end if;

  insert into public.message_threads (center_id, startup_id, application_id, subject, started_by, started_by_side,
    founder_last_read_at, center_last_read_at)
  values (p_center_id, p_startup_id, p_application_id, left(trim(p_subject), 150), (select auth.uid()), v_side,
    case when v_side = 'founder' then now() end, case when v_side = 'center' then now() end)
  returning id into v_thread;

  insert into public.messages (thread_id, sender_id, sender_side, body)
  values (v_thread, (select auth.uid()), v_side, left(trim(p_body), 5000));

  if v_side = 'center' then
    perform private.notify(v_owner, 'message.new', 'New message from ' || c.name, left(trim(p_subject), 150), '/messages/' || v_thread);
  else
    perform private.notify_center_staff(p_center_id, 'message.new', 'New message from ' || v_startup_name,
      left(trim(p_subject), 150), '/manage/' || c.slug || '/messages/' || v_thread);
  end if;
  return v_thread;
end;
$$;

create or replace function public.send_message(p_thread_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.message_threads%rowtype;
  c public.incubation_centers%rowtype;
  v_side text;
  v_message uuid;
  v_owner uuid;
  v_startup_name text;
begin
  perform private.require_active_user();
  if coalesce(trim(p_body), '') = '' then
    raise exception 'message_required' using errcode = 'P0001';
  end if;

  select * into t from public.message_threads where id = p_thread_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  select owner_id, name into v_owner, v_startup_name from public.startups where id = t.startup_id;

  if private.is_center_staff(t.center_id) then
    v_side := 'center';
  elsif v_owner = (select auth.uid()) then
    v_side := 'founder';
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into c from public.incubation_centers where id = t.center_id;
  if c.status <> 'active' then
    raise exception 'centre_suspended' using errcode = 'P0001';
  end if;

  insert into public.messages (thread_id, sender_id, sender_side, body)
  values (t.id, (select auth.uid()), v_side, left(trim(p_body), 5000))
  returning id into v_message;

  update public.message_threads
  set last_message_at = now(),
      founder_archived_at = null,
      center_archived_at = null,
      founder_last_read_at = case when v_side = 'founder' then now() else founder_last_read_at end,
      center_last_read_at = case when v_side = 'center' then now() else center_last_read_at end
  where id = t.id;

  if v_side = 'center' then
    perform private.notify(v_owner, 'message.new', 'New message from ' || c.name, t.subject, '/messages/' || t.id);
  else
    perform private.notify_center_staff(t.center_id, 'message.new', 'New message from ' || v_startup_name, t.subject,
      '/manage/' || c.slug || '/messages/' || t.id);
  end if;
  return v_message;
end;
$$;

create or replace function public.set_thread_archived(p_thread_id uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.message_threads%rowtype;
begin
  perform private.require_active_user();
  select * into t from public.message_threads where id = p_thread_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if private.is_startup_owner(t.startup_id) then
    update public.message_threads set founder_archived_at = case when p_archived then now() end where id = t.id;
  elsif private.is_center_staff(t.center_id) then
    update public.message_threads set center_archived_at = case when p_archived then now() end where id = t.id;
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.mark_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.message_threads%rowtype;
begin
  select * into t from public.message_threads where id = p_thread_id;
  if not found then
    return;
  end if;
  if private.is_startup_owner(t.startup_id) then
    update public.message_threads set founder_last_read_at = now() where id = t.id;
  elsif private.is_center_staff(t.center_id) then
    update public.message_threads set center_last_read_at = now() where id = t.id;
  end if;
end;
$$;

-- Report unwanted contact or an inappropriate message to the master admin.
create or replace function public.report_thread(p_thread_id uuid, p_reason text, p_message_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.message_threads%rowtype;
  v_side text;
  v_report uuid;
begin
  perform private.require_active_user();
  if char_length(coalesce(trim(p_reason), '')) < 5 then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  select * into t from public.message_threads where id = p_thread_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if private.is_startup_owner(t.startup_id) then
    v_side := 'founder';
  elsif private.is_center_staff(t.center_id) then
    v_side := 'center';
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_message_id is not null and not exists (select 1 from public.messages where id = p_message_id and thread_id = t.id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  insert into public.reports (reporter_id, reporter_side, thread_id, message_id, reason)
  values ((select auth.uid()), v_side, t.id, p_message_id, left(trim(p_reason), 2000))
  returning id into v_report;

  perform private.audit('report.created', 'report', v_report::text, t.center_id, jsonb_build_object('thread_id', t.id, 'side', v_side));
  perform private.notify_admins('report.new', 'New report of unwanted contact', left(trim(p_reason), 200), '/admin/reports');
  return v_report;
end;
$$;

-- ===========================================================================
-- 18. Invitations (centre staff and expert accounts)
-- ===========================================================================
create or replace function public.admin_invite_staff(p_center_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_token uuid;
begin
  perform private.require_active_user();
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.incubation_centers where id = p_center_id and status <> 'archived') then
    raise exception 'centre_not_found' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.center_staff_memberships m join auth.users u on u.id = m.user_id
    where m.center_id = p_center_id and m.status = 'active' and lower(u.email) = v_email
  ) then
    raise exception 'already_staff' using errcode = 'P0001';
  end if;

  select token into v_token from public.invitations
  where kind = 'center_staff' and center_id = p_center_id and email = v_email and status = 'pending' and expires_at > now();
  if v_token is not null then
    return v_token;
  end if;

  insert into public.invitations (kind, center_id, email, invited_by)
  values ('center_staff', p_center_id, v_email, (select auth.uid()))
  returning token into v_token;

  perform private.audit('staff.invited', 'center', p_center_id::text, p_center_id, jsonb_build_object('email', v_email));
  return v_token;
end;
$$;

create or replace function public.invite_expert(p_expert_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  e public.center_experts%rowtype;
  v_token uuid;
begin
  perform private.require_active_user();
  select * into e from public.center_experts where id = p_expert_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not (private.is_center_staff(e.center_id) or private.is_platform_admin()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if e.user_id is not null then
    raise exception 'expert_already_linked' using errcode = 'P0001';
  end if;

  select token into v_token from public.invitations
  where kind = 'expert' and expert_id = e.id and email = v_email and status = 'pending' and expires_at > now();
  if v_token is not null then
    return v_token;
  end if;

  insert into public.invitations (kind, center_id, expert_id, email, invited_by)
  values ('expert', e.center_id, e.id, v_email, (select auth.uid()))
  returning token into v_token;

  perform private.audit('expert.invited', 'expert', e.id::text, e.center_id, jsonb_build_object('email', v_email));
  return v_token;
end;
$$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  i public.invitations%rowtype;
begin
  perform private.require_active_user();
  select * into i from public.invitations where id = p_invitation_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not (private.is_platform_admin() or (i.kind = 'expert' and private.is_center_staff(i.center_id))) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.invitations set status = 'revoked', revoked_at = now() where id = i.id and status = 'pending';
  perform private.audit('invitation.revoked', 'invitation', i.id::text, i.center_id, jsonb_build_object('email', i.email, 'kind', i.kind));
end;
$$;

-- Anyone signed in with the invited email address can accept.
create or replace function public.invitation_details(p_token uuid)
returns table (kind public.invitation_kind, center_name text, expert_name text, email_matches boolean, is_valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select i.kind, c.name, e.full_name,
    lower(u.email) = i.email,
    i.status = 'pending' and i.expires_at > now() and c.status <> 'archived'
  from public.invitations i
  join public.incubation_centers c on c.id = i.center_id
  left join public.center_experts e on e.id = i.expert_id
  left join auth.users u on u.id = (select auth.uid())
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  i public.invitations%rowtype;
  v_email text;
  v_slug text;
begin
  perform private.require_active_user();
  select * into i from public.invitations where token = p_token for update;
  if not found or i.status <> 'pending' or i.expires_at <= now() then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;

  select lower(email) into v_email from auth.users where id = (select auth.uid()) and email_confirmed_at is not null;
  if v_email is null or v_email <> i.email then
    raise exception 'invitation_wrong_account' using errcode = 'P0001';
  end if;

  select slug into v_slug from public.incubation_centers where id = i.center_id and status <> 'archived';
  if v_slug is null then
    raise exception 'centre_not_found' using errcode = 'P0001';
  end if;

  if i.kind = 'center_staff' then
    insert into public.center_staff_memberships (center_id, user_id, invited_email, invited_by)
    values (i.center_id, (select auth.uid()), i.email, i.invited_by)
    on conflict (center_id, user_id) do update
      set status = 'active', revoked_at = null, revoked_by = null, invited_email = excluded.invited_email;
    perform private.audit('staff.joined', 'center', i.center_id::text, i.center_id, jsonb_build_object('email', i.email));
  else
    update public.center_experts set user_id = (select auth.uid())
    where id = i.expert_id and (user_id is null or user_id = (select auth.uid()));
    if not found then
      raise exception 'expert_already_linked' using errcode = 'P0001';
    end if;
    perform private.audit('expert.linked', 'expert', i.expert_id::text, i.center_id, jsonb_build_object('email', i.email));
  end if;

  update public.invitations set status = 'accepted', accepted_by = (select auth.uid()), accepted_at = now() where id = i.id;
  return case when i.kind = 'center_staff' then '/manage/' || v_slug else '/expert' end;
end;
$$;

create or replace function public.admin_revoke_staff(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.center_staff_memberships%rowtype;
begin
  perform private.require_active_user();
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.center_staff_memberships
  set status = 'revoked', revoked_at = now(), revoked_by = (select auth.uid())
  where id = p_membership_id and status = 'active'
  returning * into m;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  perform private.audit('staff.revoked', 'center', m.center_id::text, m.center_id,
    jsonb_build_object('user_id', m.user_id, 'email', m.invited_email));
  perform private.notify(m.user_id, 'staff.revoked', 'Your centre access was removed',
    'The platform administrator removed your staff access.', '/dashboard');
end;
$$;

-- ===========================================================================
-- 19. Booking workflow
-- ===========================================================================

-- Open future slots for an expert, without revealing who booked the others.
create or replace function public.available_slots(p_expert_id uuid)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.starts_at, s.ends_at
  from public.availability_slots s
  join public.center_experts e on e.id = s.expert_id
  join public.incubation_centers c on c.id = e.center_id
  where s.expert_id = p_expert_id
    and (select auth.uid()) is not null
    and e.is_active and c.status = 'active'
    and not s.is_cancelled
    and s.starts_at > now()
    and not exists (
      select 1 from public.consultation_bookings b
      where b.slot_id = s.id and b.status in ('pending', 'payment_instructions_sent', 'confirmed')
    )
  order by s.starts_at
  limit 200;
$$;

-- Can this founder book this expert? Returns null when allowed, or the reason it isn't.
create or replace function public.booking_eligibility(p_expert_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  e public.center_experts%rowtype;
  v_startup uuid;
  v_admitted boolean;
  v_center_status public.center_status;
begin
  if (select auth.uid()) is null then
    return 'not_signed_in';
  end if;
  if not private.current_user_is_active() then
    return 'account_suspended';
  end if;
  select * into e from public.center_experts where id = p_expert_id;
  if not found or not e.is_active then
    return 'expert_unavailable';
  end if;
  select status into v_center_status from public.incubation_centers where id = e.center_id;
  if v_center_status <> 'active' then
    return 'centre_suspended';
  end if;
  select id into v_startup from public.startups where owner_id = (select auth.uid());
  if v_startup is null then
    return 'no_startup';
  end if;
  v_admitted := private.is_admitted(v_startup, e.center_id);
  if e.engagement_policy = 'admitted_only' and not v_admitted then
    return 'policy_admitted_only';
  end if;
  if e.engagement_policy = 'pre_admission' and v_admitted then
    return 'policy_pre_admission';
  end if;
  return null;
end;
$$;

create or replace function private.booking_manager_notify(b public.consultation_bookings, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
  v_expert_user uuid;
begin
  select slug into v_slug from public.incubation_centers where id = b.center_id;
  select user_id into v_expert_user from public.center_experts where id = b.expert_id;
  perform private.notify_center_staff(b.center_id, 'booking.update', p_title, p_body, '/manage/' || v_slug || '/bookings/' || b.id);
  if v_expert_user is distinct from (select auth.uid()) then
    perform private.notify(v_expert_user, 'booking.update', p_title, p_body, '/expert/bookings/' || b.id);
  end if;
end;
$$;

-- A founder asks for a session. This creates a PENDING request, never a confirmed booking,
-- and no payment is taken.
create or replace function public.request_booking(p_slot_id uuid, p_format public.session_format, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.availability_slots%rowtype;
  e public.center_experts%rowtype;
  v_reason text;
  v_startup uuid;
  v_startup_name text;
  v_booking uuid;
begin
  perform private.require_active_user();

  select * into s from public.availability_slots where id = p_slot_id for update;
  if not found or s.is_cancelled or s.starts_at <= now() then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;
  select * into e from public.center_experts where id = s.expert_id;

  v_reason := public.booking_eligibility(e.id);
  if v_reason is not null then
    raise exception '%', v_reason using errcode = 'P0001';
  end if;

  if (p_format = 'online' and not e.offers_online) or (p_format = 'in_person' and not e.offers_in_person) then
    raise exception 'format_not_offered' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.consultation_bookings b
    where b.slot_id = s.id and b.status in ('pending', 'payment_instructions_sent', 'confirmed')
  ) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  select id, name into v_startup, v_startup_name from public.startups where owner_id = (select auth.uid());

  begin
    insert into public.consultation_bookings (
      expert_id, center_id, slot_id, startup_id, founder_id, format, founder_note,
      is_paid, fee_inr, session_minutes, starts_at, ends_at, meeting_location
    ) values (
      e.id, e.center_id, s.id, v_startup, (select auth.uid()), p_format, nullif(left(trim(coalesce(p_note, '')), 2000), ''),
      e.is_paid, e.fee_inr, e.session_minutes, s.starts_at, s.ends_at,
      case when p_format = 'in_person' then e.in_person_location end
    )
    returning id into v_booking;
  exception when unique_violation then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor_id, actor_side)
  values (v_booking, null, 'pending', nullif(left(trim(coalesce(p_note, '')), 2000), ''), (select auth.uid()), 'founder');

  perform private.booking_manager_notify(
    (select b from public.consultation_bookings b where b.id = v_booking),
    'New session request for ' || e.full_name,
    v_startup_name || ' asked for a ' || replace(p_format::text, '_', '-') || ' session.'
  );
  return v_booking;
end;
$$;

-- The expert (or centre staff) acts on a request.
create or replace function public.update_booking(
  p_booking_id uuid,
  p_action text,
  p_note text default null,
  p_payment_instructions text default null,
  p_meeting_link text default null,
  p_meeting_location text default null,
  p_proposed_slot_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.consultation_bookings%rowtype;
  v_to public.booking_status;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 2000), '');
  v_title text;
  p public.availability_slots%rowtype;
begin
  perform private.require_active_user();
  select * into b from public.consultation_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not private.can_manage_expert(b.expert_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_action = 'send_payment_instructions' then
    if b.status not in ('pending', 'payment_instructions_sent') or not b.is_paid then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    if coalesce(trim(p_payment_instructions), '') = '' then
      raise exception 'payment_instructions_required' using errcode = 'P0001';
    end if;
    v_to := 'payment_instructions_sent';
    update public.consultation_bookings
    set status = v_to, payment_instructions = left(trim(p_payment_instructions), 2000), status_changed_at = now()
    where id = b.id;
    v_title := 'Payment instructions for your session';

  elsif p_action = 'confirm' then
    if b.status not in ('pending', 'payment_instructions_sent') then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    if b.format = 'online' and coalesce(trim(p_meeting_link), '') = '' then
      raise exception 'meeting_link_required' using errcode = 'P0001';
    end if;
    if b.format = 'in_person' and coalesce(nullif(trim(p_meeting_location), ''), b.meeting_location, '') = '' then
      raise exception 'meeting_location_required' using errcode = 'P0001';
    end if;
    v_to := 'confirmed';
    update public.consultation_bookings
    set status = v_to,
        meeting_link = case when b.format = 'online' then trim(p_meeting_link) end,
        meeting_location = case when b.format = 'in_person' then coalesce(nullif(trim(p_meeting_location), ''), b.meeting_location) end,
        expert_note = coalesce(v_note, expert_note),
        proposed_slot_id = null, proposed_note = null,
        status_changed_at = now()
    where id = b.id;
    v_title := 'Your session is confirmed';

  elsif p_action = 'decline' then
    if b.status not in ('pending', 'payment_instructions_sent') then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    v_to := 'declined';
    update public.consultation_bookings
    set status = v_to, expert_note = v_note, proposed_slot_id = null, status_changed_at = now()
    where id = b.id;
    v_title := 'Your session request was declined';

  elsif p_action = 'propose_time' then
    if b.status not in ('pending', 'payment_instructions_sent') then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    select * into p from public.availability_slots where id = p_proposed_slot_id;
    if not found or p.expert_id <> b.expert_id or p.is_cancelled or p.starts_at <= now() or p.id = b.slot_id
      or exists (select 1 from public.consultation_bookings x
                 where x.slot_id = p.id and x.status in ('pending', 'payment_instructions_sent', 'confirmed')) then
      raise exception 'slot_unavailable' using errcode = 'P0001';
    end if;
    v_to := b.status;
    update public.consultation_bookings set proposed_slot_id = p.id, proposed_note = v_note where id = b.id;
    v_title := 'The expert suggested another time';

  elsif p_action = 'cancel' then
    if b.status <> 'confirmed' then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    v_to := 'cancelled';
    update public.consultation_bookings set status = v_to, expert_note = v_note, status_changed_at = now() where id = b.id;
    v_title := 'Your session was cancelled by the expert';

  elsif p_action in ('complete', 'no_show') then
    if b.status <> 'confirmed' then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    if b.starts_at > now() then
      raise exception 'session_not_started' using errcode = 'P0001';
    end if;
    v_to := (case when p_action = 'complete' then 'completed' else 'no_show' end)::public.booking_status;
    update public.consultation_bookings set status = v_to, expert_note = coalesce(v_note, expert_note), status_changed_at = now() where id = b.id;
    v_title := case when p_action = 'complete' then 'Your session was marked as completed' else 'Your session was marked as missed' end;

  else
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor_id, actor_side)
  values (b.id, b.status, v_to,
    coalesce(v_note, case when p_action = 'propose_time' then 'Suggested another time' end),
    (select auth.uid()), 'expert');

  perform private.notify(b.founder_id, 'booking.update', v_title, v_note, '/bookings/' || b.id);
end;
$$;

-- The founder cancels a request (for example when the expert hasn't replied) or accepts
-- a suggested new time.
create or replace function public.founder_update_booking(p_booking_id uuid, p_action text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.consultation_bookings%rowtype;
  p public.availability_slots%rowtype;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 2000), '');
begin
  perform private.require_active_user();
  select * into b from public.consultation_bookings where id = p_booking_id for update;
  if not found or b.founder_id <> (select auth.uid()) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  if p_action = 'cancel' then
    if b.status not in ('pending', 'payment_instructions_sent', 'confirmed') then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    update public.consultation_bookings
    set status = 'cancelled', proposed_slot_id = null, status_changed_at = now()
    where id = b.id;
    insert into public.booking_events (booking_id, from_status, to_status, note, actor_id, actor_side)
    values (b.id, b.status, 'cancelled', v_note, (select auth.uid()), 'founder');
    perform private.booking_manager_notify(b, 'A founder cancelled a session request', coalesce(v_note, 'The founder cancelled.'));

  elsif p_action = 'accept_proposal' then
    if b.status not in ('pending', 'payment_instructions_sent') or b.proposed_slot_id is null then
      raise exception 'invalid_transition' using errcode = 'P0001';
    end if;
    select * into p from public.availability_slots where id = b.proposed_slot_id for update;
    if p.is_cancelled or p.starts_at <= now() or exists (
      select 1 from public.consultation_bookings x
      where x.slot_id = p.id and x.id <> b.id and x.status in ('pending', 'payment_instructions_sent', 'confirmed')
    ) then
      raise exception 'slot_unavailable' using errcode = 'P0001';
    end if;
    begin
      update public.consultation_bookings
      set slot_id = p.id, starts_at = p.starts_at, ends_at = p.ends_at, proposed_slot_id = null, proposed_note = null
      where id = b.id;
    exception when unique_violation then
      raise exception 'slot_unavailable' using errcode = 'P0001';
    end;
    insert into public.booking_events (booking_id, from_status, to_status, note, actor_id, actor_side)
    values (b.id, b.status, b.status, 'Accepted the suggested time', (select auth.uid()), 'founder');
    perform private.booking_manager_notify(b, 'A founder accepted your suggested time', 'Please confirm the session when you are ready.');

  else
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;
end;
$$;

-- ===========================================================================
-- 20. Notifications, access logging, counts
-- ===========================================================================
create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now() where user_id = (select auth.uid()) and read_at is null;
$$;

-- Called by the app when someone opens a page their role doesn't allow.
create or replace function public.log_access_denied(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;
  perform private.audit('access.denied', 'path', left(coalesce(p_path, ''), 80), null, '{}'::jsonb);
end;
$$;

create or replace function public.center_stats(p_center_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_center_staff(p_center_id) or private.is_platform_admin()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'applications', coalesce((
      select jsonb_object_agg(status, n) from (
        select status, count(*) n from public.startup_applications
        where center_id = p_center_id and status <> 'draft' group by status
      ) x
    ), '{}'::jsonb),
    'active_experts', (select count(*) from public.center_experts where center_id = p_center_id and is_active),
    'pending_bookings', (select count(*) from public.consultation_bookings
      where center_id = p_center_id and status in ('pending', 'payment_instructions_sent')),
    'upcoming_sessions', (select count(*) from public.consultation_bookings
      where center_id = p_center_id and status = 'confirmed' and starts_at > now())
  );
end;
$$;

-- Platform-wide counts for the master admin. Counts only, no personal data.
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'suspended_users', (select count(*) from public.profiles where is_suspended),
    'founders', (select count(*) from public.user_roles where role = 'founder'),
    'startups', (select count(*) from public.startups),
    'centres', coalesce((select jsonb_object_agg(status, n) from (
      select status, count(*) n from public.incubation_centers group by status) x), '{}'::jsonb),
    'staff', (select count(*) from public.center_staff_memberships where status = 'active'),
    'active_experts', (select count(*) from public.center_experts where is_active),
    'applications', coalesce((select jsonb_object_agg(status, n) from (
      select status, count(*) n from public.startup_applications where status <> 'draft' group by status) x), '{}'::jsonb),
    'bookings', coalesce((select jsonb_object_agg(status, n) from (
      select status, count(*) n from public.consultation_bookings group by status) x), '{}'::jsonb),
    'threads', (select count(*) from public.message_threads),
    'open_reports', (select count(*) from public.reports where status = 'open')
  );
end;
$$;

-- ===========================================================================
-- 21. Master admin: users and moderation
-- ===========================================================================

-- Users list for moderation. Emails are masked: the admin sees enough to recognise
-- an account, not the full address.
create or replace function public.admin_list_users(p_search text default null, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, full_name text, masked_email text, roles text[], is_suspended boolean,
  suspension_reason text, domicile_declared boolean, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select p.id, p.full_name,
      case when u.email is null then null
        else left(u.email, 1) || '***@' || split_part(u.email, '@', 2) end,
      coalesce((select array_agg(r.role::text order by r.role) from public.user_roles r where r.user_id = p.id), '{}'),
      p.is_suspended, p.suspension_reason, fp.domicile_declared, p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join public.founder_profiles fp on fp.user_id = p.id
    where p_search is null or trim(p_search) = ''
      or p.full_name ilike '%' || trim(p_search) || '%'
      or lower(u.email) = lower(trim(p_search))
    order by p.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_set_user_suspension(p_user_id uuid, p_suspended boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_suspend_self' using errcode = 'P0001';
  end if;
  update public.profiles
  set is_suspended = p_suspended,
      suspended_at = case when p_suspended then now() end,
      suspension_reason = case when p_suspended then nullif(left(trim(coalesce(p_reason, '')), 500), '') end
  where id = p_user_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  perform private.audit(case when p_suspended then 'user.suspended' else 'user.reinstated' end,
    'user', p_user_id::text, null, jsonb_build_object('reason', nullif(trim(coalesce(p_reason, '')), '')));
end;
$$;

create or replace function public.admin_hide_message(p_message_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread uuid;
  v_center uuid;
begin
  perform private.require_active_user();
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.messages
  set hidden_at = now(), hidden_by = (select auth.uid()), hidden_reason = nullif(left(trim(coalesce(p_reason, '')), 500), '')
  where id = p_message_id
  returning thread_id into v_thread;
  if v_thread is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  select center_id into v_center from public.message_threads where id = v_thread;
  perform private.audit('message.hidden', 'message', p_message_id::text, v_center, jsonb_build_object('thread_id', v_thread));
end;
$$;

create or replace function public.admin_resolve_report(p_report_id uuid, p_status public.report_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform private.require_active_user();
  if not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_status = 'open' then
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;
  update public.reports
  set status = p_status, resolution_note = nullif(left(trim(coalesce(p_note, '')), 2000), ''),
      reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_report_id
  returning * into r;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  perform private.audit('report.' || p_status::text, 'report', r.id::text, null, jsonb_build_object('thread_id', r.thread_id));
  perform private.notify(r.reporter_id, 'report.reviewed', 'Your report was reviewed',
    coalesce(r.resolution_note, 'The platform administrator reviewed your report.'), null);
end;
$$;

-- The first master admin is created from the SQL editor (see README):
--   select private.grant_platform_admin('you@example.com');
create or replace function private.grant_platform_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No account with that email. Register on the site first.';
  end if;
  insert into public.user_roles (user_id, role) values (v_user, 'platform_admin') on conflict do nothing;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (null, 'admin.granted', 'user', v_user::text, jsonb_build_object('via', 'sql'));
  return 'Master admin access granted to ' || lower(trim(p_email));
end;
$$;

-- ===========================================================================
-- 22. Function permissions
-- ===========================================================================
-- Nothing in the private schema is callable through the API. Signed-in users may run
-- only the role checks that RLS policies need.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.current_user_is_active(),
  private.is_platform_admin(),
  private.is_center_staff(uuid),
  private.is_active_center_staff(),
  private.is_startup_owner(uuid),
  private.can_manage_expert(uuid),
  private.is_booking_expert_for(uuid),
  private.shares_center_with(uuid),
  private.is_thread_participant(uuid)
to authenticated;

-- Workflow functions are for signed-in users only; each checks the caller's role itself.
revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
