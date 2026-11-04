-- LOCAL DEVELOPMENT ONLY. Never run this on a hosted Supabase project.
--
-- Creates demo accounts with a shared password so every role can be tried locally:
--   admin@udyamsetu.local     master administrator
--   staff@udyamsetu.local     staff at Tawi Innovation Hub (Sample)
--   expert@udyamsetu.local    linked to the expert "Dr. Asha Verma (Sample)"
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
where c.slug = 'tawi-innovation-hub-sample' and u.email = 'staff@udyamsetu.local'
on conflict do nothing;

update public.center_experts e
set user_id = u.id
from auth.users u
where u.email = 'expert@udyamsetu.local' and e.full_name = 'Dr. Asha Verma (Sample)' and e.user_id is null;

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
