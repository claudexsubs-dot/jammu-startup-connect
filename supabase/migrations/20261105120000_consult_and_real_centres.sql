-- Consultations marketplace and real centre listings
--
-- 1. Centres can carry a public source for their listing (for example the news report or
--    portal page that names them as a Mission YUVA incubation centre), so the site can cite it.
-- 2. Open consultation times become visible to visitors who haven't signed in, so founders can
--    see when an expert is free before creating an account. Only the slot times are shown:
--    never who booked what.
-- 3. A public expert directory function lists active experts at active centres with their
--    next open time and how many times are open over the next 14 days.
--
-- Nothing is deleted and no existing data changes.

alter table public.incubation_centers
  add column source_label text check (char_length(source_label) <= 200),
  add column source_url text check (char_length(source_url) <= 500 and source_url ~* '^https?://');

comment on column public.incubation_centers.source_label is 'Where this listing comes from, shown on the centre page.';
comment on column public.incubation_centers.source_url is 'Link to the public source for this listing.';

-- Only the master admin changes where a listing comes from (as well as status, slug and sample flag).
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
      or new.source_label is distinct from old.source_label
      or new.source_url is distinct from old.source_url
      or new.created_by is distinct from old.created_by then
      raise exception 'admin_only_fields' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_center_admin_fields() from public, anon, authenticated;

-- Open times for one expert. Visitors may see them too; booking still needs an account.
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

-- Every active expert at an active centre, with their next open time.
create or replace function public.expert_directory()
returns table (
  id uuid,
  full_name text,
  headline text,
  organization text,
  expertise_tags text[],
  engagement_policy public.engagement_policy,
  is_paid boolean,
  fee_inr integer,
  session_minutes smallint,
  offers_online boolean,
  offers_in_person boolean,
  center_id uuid,
  center_slug text,
  center_name text,
  center_district text,
  center_is_sample boolean,
  next_slot_at timestamptz,
  open_slots_14d integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.full_name, e.headline, e.organization, e.expertise_tags, e.engagement_policy,
    e.is_paid, e.fee_inr, e.session_minutes, e.offers_online, e.offers_in_person,
    c.id, c.slug, c.name, c.district, c.is_sample,
    o.next_slot_at, coalesce(o.open_slots_14d, 0)::integer
  from public.center_experts e
  join public.incubation_centers c on c.id = e.center_id
  left join lateral (
    select
      min(s.starts_at) as next_slot_at,
      count(*) filter (where s.starts_at < now() + interval '14 days') as open_slots_14d
    from public.availability_slots s
    where s.expert_id = e.id
      and not s.is_cancelled
      and s.starts_at > now()
      and not exists (
        select 1 from public.consultation_bookings b
        where b.slot_id = s.id and b.status in ('pending', 'payment_instructions_sent', 'confirmed')
      )
  ) o on true
  where e.is_active and c.status = 'active'
  order by o.next_slot_at nulls last, e.full_name
  limit 500;
$$;

revoke all on function public.available_slots(uuid) from public;
revoke all on function public.expert_directory() from public;
grant execute on function public.available_slots(uuid) to anon, authenticated;
grant execute on function public.expert_directory() to anon, authenticated;
