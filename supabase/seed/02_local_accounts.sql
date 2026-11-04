-- LOCAL DEVELOPMENT ONLY. Never run this on a hosted Supabase project.
--
-- Creates demo accounts with a shared password so every role can be tried locally:
--   admin@udyamsetu.local     master administrator
--   staff@udyamsetu.local     staff at IIM Jammu Incubation Centre
--   expert@udyamsetu.local    linked to the local demo expert "Dr. Asha Verma (Local demo)"
--   founder@udyamsetu.local   founder with a complete venture profile
--   newfounder@udyamsetu.local founder who has only registered
-- Password for all of them: Udyam-local-123

do $$
declare
  accounts constant jsonb := '[
    {"email": "admin@udyamsetu.local", "meta": {"full_name": "Local Admin", "account_type": "invitee"}},
    {"email": "staff@udyamsetu.local", "meta": {"full_name": "Local Centre Staff", "account_type": "invitee"}},
    {"email": "expert@udyamsetu.local", "meta": {"full_name": "Local Expert", "account_type": "invitee"}},
    {"email": "founder@udyamsetu.local", "meta": {"full_name": "Local Founder", "account_type": "founder", "phone": "9000000001", "district": "Jammu", "city": "Jammu", "domicile_declared": "true", "consent_given": "true"}},
    {"email": "newfounder@udyamsetu.local", "meta": {"full_name": "New Founder", "account_type": "founder", "district": "Kathua", "domicile_declared": "true", "consent_given": "true"}}
  ]';
  account jsonb;
  v_id uuid;
begin
  for account in select * from jsonb_array_elements(accounts) loop
    if exists (select 1 from auth.users where email = account ->> 'email') then
      continue;
    end if;
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', account ->> 'email',
      extensions.crypt('Udyam-local-123', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}', account -> 'meta', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', account ->> 'email', 'email_verified', true),
      'email', now(), now(), now());
  end loop;
end;
$$;

select private.grant_platform_admin('admin@udyamsetu.local');

insert into public.center_staff_memberships (center_id, user_id, invited_email)
select c.id, u.id, u.email
from public.incubation_centers c, auth.users u
where c.slug = 'iim-jammu' and u.email = 'staff@udyamsetu.local'
on conflict do nothing;

-- Local demo experts, so booking can be tried end to end on a developer's computer.
-- These people are fictional and exist only in local databases.
update public.incubation_centers set accepting_applications = true where slug in ('iim-jammu', 'iit-jammu', 'skuast-jammu');

-- Local demo focus areas, so filters and recommendations can be tried.
insert into public.center_stages (center_id, stage_id)
select c.id, st.id from (values
  ('iim-jammu', 'ideation'), ('iim-jammu', 'early_stage'),
  ('iit-jammu', 'early_stage'), ('iit-jammu', 'established'),
  ('skuast-jammu', 'ideation'), ('skuast-jammu', 'early_stage')
) as v(slug, stage)
join public.incubation_centers c on c.slug = v.slug
join public.startup_stages st on st.code = v.stage
on conflict do nothing;

insert into public.center_services (center_id, support_need_id)
select c.id, n.id from (values
  ('iim-jammu', 'mentorship'), ('iim-jammu', 'business-model'), ('iim-jammu', 'funding-readiness'), ('iim-jammu', 'market-access'),
  ('iit-jammu', 'prototype-lab-access'), ('iit-jammu', 'technology'),
  ('skuast-jammu', 'prototype-lab-access'), ('skuast-jammu', 'market-access')
) as v(slug, need)
join public.incubation_centers c on c.slug = v.slug
join public.support_needs n on n.slug = v.need
on conflict do nothing;

insert into public.center_experts
  (center_id, full_name, headline, organization, bio, expertise_tags, engagement_policy,
   is_paid, fee_inr, session_minutes, offers_online, offers_in_person, in_person_location)
select c.id, v.full_name, v.headline, v.organization, v.bio, v.tags, v.policy::public.engagement_policy,
  v.is_paid, v.fee, v.minutes, v.online, v.in_person, v.location
from (values
  ('iim-jammu', 'Dr. Asha Verma (Local demo)', 'Faculty, strategy and entrepreneurship', 'Local demo',
   'Helps early founders sharpen their business model, pricing and pitch.',
   array['Business model', 'Pricing', 'Pitching'], 'both', true, 1500, 45, true, true, 'Incubation centre, Jagti campus (demo)'),
  ('iim-jammu', 'Rohan Gupta (Local demo)', 'Startup mentor', 'Local demo',
   'Former founder who mentors first-time teams on customer discovery.',
   array['Customer discovery', 'Go-to-market'], 'both', false, null, 30, true, false, null),
  ('iit-jammu', 'Er. Vikram Singh (Local demo)', 'Hardware and prototyping', 'Local demo',
   'Reviews prototype designs and helps choose materials and manufacturing methods.',
   array['Prototyping', 'CAD', 'IoT'], 'both', true, 1000, 60, true, true, 'Workshop, IIT Jammu (demo)'),
  ('skuast-jammu', 'Dr. Meera Sharma (Local demo)', 'Food technology', 'Local demo',
   'Advises on food safety testing, shelf-life studies and FSSAI paperwork.',
   array['Food safety', 'FSSAI', 'Agritech'], 'admitted_only', false, null, 45, true, false, null)
) as v(slug, full_name, headline, organization, bio, tags, policy, is_paid, fee, minutes, online, in_person, location)
join public.incubation_centers c on c.slug = v.slug
where not exists (select 1 from public.center_experts e where e.center_id = c.id and e.full_name = v.full_name);

insert into public.availability_slots (expert_id, starts_at, ends_at)
select e.id, t.starts_at, t.starts_at + make_interval(mins => e.session_minutes)
from public.center_experts e
cross join lateral (
  select ((d::date + h) at time zone 'Asia/Kolkata') as starts_at
  from generate_series((now() at time zone 'Asia/Kolkata')::date + 1, (now() at time zone 'Asia/Kolkata')::date + 14, interval '1 day') d
  cross join (values (time '10:00'), (time '12:00'), (time '15:00'), (time '17:00')) as hours(h)
  where extract(isodow from d) < 7
) t
where e.full_name like '%(Local demo)' and not exists (select 1 from public.availability_slots s where s.expert_id = e.id)
on conflict do nothing;

update public.center_experts e
set user_id = u.id
from auth.users u
where u.email = 'expert@udyamsetu.local' and e.full_name = 'Dr. Asha Verma (Local demo)' and e.user_id is null;

-- A complete venture profile for the demo founder.
insert into public.startups (owner_id, name, description, founding_year, stage_id, problem, solution, target_customers,
  district, city, offering_type, legal_status, traction_level, traction_summary, website)
select u.id, 'Saffron Route Logistics (Demo)',
  'Shared cold-chain transport for small fruit and saffron growers.',
  2025, (select id from public.startup_stages where code = 'early_stage'),
  'Small growers lose up to a third of their harvest because refrigerated transport is too expensive for one farm.',
  'A booking app that pools loads from nearby farms into shared refrigerated vans.',
  'Fruit growers and farmer producer organisations in the Jammu division.',
  'Jammu', 'Jammu', 'service', 'private_limited', 'pilots', 'Two pilot routes with 40 growers since March.',
  'https://example.com'
from auth.users u
where u.email = 'founder@udyamsetu.local'
on conflict do nothing;

insert into public.startup_sectors (startup_id, sector_id)
select s.id, sec.id from public.startups s
join auth.users u on u.id = s.owner_id and u.email = 'founder@udyamsetu.local'
join public.sectors sec on sec.slug in ('agriculture-food-processing', 'logistics-transport')
on conflict do nothing;

insert into public.startup_support_needs (startup_id, support_need_id)
select s.id, n.id from public.startups s
join auth.users u on u.id = s.owner_id and u.email = 'founder@udyamsetu.local'
join public.support_needs n on n.slug in ('mentorship', 'prototype-lab-access', 'market-access')
on conflict do nothing;
