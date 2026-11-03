-- Jammu Startup Connect: Phase 1 foundation
-- Auth-linked profiles, roles, sectors, startups, team members, financials.
-- DRAFT: not applied. Waiting for approval.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.startup_stage as enum (
  'ideation', 'validation', 'early_development', 'early_traction', 'scaling', 'established'
);

create type public.legal_status as enum (
  'not_registered', 'registration_in_progress', 'sole_proprietorship',
  'partnership', 'llp', 'private_limited', 'public_limited', 'other'
);

create type public.offering_type as enum ('product', 'service', 'both');

-- Access a member has to a startup's private data. Null = listed on the team only.
create type public.member_access as enum ('owner', 'editor', 'viewer');

create type public.platform_role as enum ('founder', 'mentor', 'incubator_admin', 'platform_admin');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.platform_role not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.sectors (
  id smallint generated always as identity primary key,
  name text not null unique,
  slug text not null unique
);

create table public.startups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 5000),
  founding_year smallint check (founding_year between 1900 and 2100),
  stage public.startup_stage not null default 'ideation',
  sector_id smallint references public.sectors (id),
  domain text check (char_length(domain) <= 120),
  offering_type public.offering_type,
  product_or_service text check (char_length(product_or_service) <= 2000),
  target_customers text check (char_length(target_customers) <= 2000),
  district text check (char_length(district) <= 60),
  city text check (char_length(city) <= 80),
  state text not null default 'Jammu and Kashmir',
  legal_status public.legal_status not null default 'not_registered',
  registration_number text check (char_length(registration_number) <= 50),
  dpiit_recognised boolean not null default false,
  website text check (char_length(website) <= 300),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index startups_owner_id_idx on public.startups (owner_id);
create index startups_sector_id_idx on public.startups (sector_id);
create index startups_published_stage_idx on public.startups (stage) where is_published;

create table public.startup_members (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text check (char_length(email) <= 254),
  role_title text check (char_length(role_title) <= 80),
  is_founder boolean not null default false,
  linkedin_url text check (char_length(linkedin_url) <= 300),
  access public.member_access,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, user_id),
  check (access is null or user_id is not null)
);

create index startup_members_user_id_idx on public.startup_members (user_id);

create table public.startup_financials (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  as_of_date date not null default current_date,
  currency char(3) not null default 'INR',
  annual_revenue numeric(14, 2) check (annual_revenue >= 0),
  monthly_operating_expenses numeric(14, 2) check (monthly_operating_expenses >= 0),
  cash_balance numeric(14, 2) check (cash_balance >= 0),
  total_funding_received numeric(14, 2) check (total_funding_received >= 0),
  monthly_burn_rate numeric(14, 2) check (monthly_burn_rate >= 0),
  cash_runway_months numeric generated always as (
    case when monthly_burn_rate > 0 then round(cash_balance / monthly_burn_rate, 1) end
  ) stored,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, as_of_date)
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger startups_updated_at before update on public.startups
  for each row execute function public.set_updated_at();
create trigger startup_members_updated_at before update on public.startup_members
  for each row execute function public.set_updated_at();
create trigger startup_financials_updated_at before update on public.startup_financials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Private helpers (not exposed through the API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_startup_member(p_startup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.startup_members
    where startup_id = p_startup_id
      and user_id = (select auth.uid())
      and access is not null
  );
$$;

create function private.can_edit_startup(p_startup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.startup_members
    where startup_id = p_startup_id
      and user_id = (select auth.uid())
      and access in ('owner', 'editor')
  );
$$;

create function private.is_startup_owner(p_startup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.startups
    where id = p_startup_id
      and owner_id = (select auth.uid())
  );
$$;

revoke all on function private.is_startup_member(uuid) from public;
revoke all on function private.can_edit_startup(uuid) from public;
revoke all on function private.is_startup_owner(uuid) from public;
grant execute on function private.is_startup_member(uuid) to authenticated;
grant execute on function private.can_edit_startup(uuid) to authenticated;
grant execute on function private.is_startup_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Automatic rows
-- ---------------------------------------------------------------------------

-- New sign-up: create the profile and give the founder role.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'founder');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- New startup: add the owner to the team with owner access.
create function private.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.startup_members (startup_id, user_id, full_name, is_founder, access)
  select new.id, new.owner_id, coalesce(p.full_name, 'Founder'), true, 'owner'
  from public.profiles p
  where p.id = new.owner_id;

  return new;
end;
$$;

create trigger startups_add_owner
  after insert on public.startups
  for each row execute function private.add_owner_as_member();

-- The owner of a startup can't be changed from the app.
create function private.prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger startups_owner_locked
  before update on public.startups
  for each row execute function private.prevent_owner_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.sectors enable row level security;
alter table public.startups enable row level security;
alter table public.startup_members enable row level security;
alter table public.startup_financials enable row level security;

-- Signed-out visitors get nothing from private tables, even before RLS.
revoke all on public.profiles, public.user_roles, public.startup_members, public.startup_financials from anon;

-- profiles
create policy "Read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- user_roles: read-only from the app
create policy "Read own roles" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- sectors: public reference list
create policy "Anyone can read sectors" on public.sectors
  for select to anon, authenticated
  using (true);

-- startups
create policy "Visitors read published startups" on public.startups
  for select to anon
  using (is_published);

create policy "Read published or own startups" on public.startups
  for select to authenticated
  using (
    is_published
    or owner_id = (select auth.uid())
    or (select private.is_startup_member(id))
  );

create policy "Create startups as owner" on public.startups
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owner and editors update startups" on public.startups
  for update to authenticated
  using ((select private.can_edit_startup(id)))
  with check ((select private.can_edit_startup(id)));

create policy "Owner deletes startups" on public.startups
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- startup_members: in Phase 1 the owner manages the team list.
-- Linking other people's accounts (user_id / access) comes with invitations later.
create policy "Team reads its members" on public.startup_members
  for select to authenticated
  using ((select private.is_startup_member(startup_id)));

create policy "Owner adds team members" on public.startup_members
  for insert to authenticated
  with check (
    (select private.is_startup_owner(startup_id))
    and user_id is null
    and access is null
  );

create policy "Owner edits team members" on public.startup_members
  for update to authenticated
  using ((select private.is_startup_owner(startup_id)))
  with check (
    (select private.is_startup_owner(startup_id))
    and (
      (user_id is null and access is null)
      or (user_id = (select auth.uid()) and access = 'owner')
    )
  );

create policy "Owner removes team members" on public.startup_members
  for delete to authenticated
  using (
    (select private.is_startup_owner(startup_id))
    and user_id is null
  );

-- startup_financials: owner and editors only, never public
create policy "Editors read financials" on public.startup_financials
  for select to authenticated
  using ((select private.can_edit_startup(startup_id)));

create policy "Editors add financials" on public.startup_financials
  for insert to authenticated
  with check ((select private.can_edit_startup(startup_id)));

create policy "Editors update financials" on public.startup_financials
  for update to authenticated
  using ((select private.can_edit_startup(startup_id)))
  with check ((select private.can_edit_startup(startup_id)));

create policy "Editors delete financials" on public.startup_financials
  for delete to authenticated
  using ((select private.can_edit_startup(startup_id)));

-- ---------------------------------------------------------------------------
-- Reference data: sectors (a real pick-list, not sample records)
-- ---------------------------------------------------------------------------
insert into public.sectors (name, slug) values
  ('Agriculture and Food Processing', 'agriculture-food-processing'),
  ('Handicrafts and Handloom', 'handicrafts-handloom'),
  ('Tourism and Hospitality', 'tourism-hospitality'),
  ('IT and Software', 'it-software'),
  ('Education', 'education'),
  ('Healthcare and Life Sciences', 'healthcare-life-sciences'),
  ('Financial Services', 'financial-services'),
  ('E-commerce and Retail', 'ecommerce-retail'),
  ('Clean Energy and Environment', 'clean-energy-environment'),
  ('Manufacturing', 'manufacturing'),
  ('Logistics and Transport', 'logistics-transport'),
  ('Media and Creative', 'media-creative'),
  ('Social Impact', 'social-impact'),
  ('Other', 'other');
