-- Sample incubation centres, mentors and experts.
--
-- These are FICTIONAL listings so the platform can be tried end to end. Every centre is
-- marked is_sample = true and the site labels it "Sample listing". None of them is a real
-- organisation, and none claims any official or government affiliation.
--
-- Safe to run more than once. The master admin can edit, suspend or delete these from
-- the admin dashboard once real centres are added.

insert into public.incubation_centers
  (slug, name, short_description, description, host_institution, district, city, address,
   application_guidance, accepting_applications, applications_close_on, is_sample)
values
  ('tawi-innovation-hub-sample', 'Tawi Innovation Hub (Sample)',
   'A general-purpose incubator for technology and services ventures in Jammu city.',
   'Tawi Innovation Hub runs a six-month incubation programme with weekly mentor hours, a shared workspace and demo days. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample host college (fictional)', 'Jammu', 'Jammu', 'Sample address, Jammu',
   'Tell us what problem you are solving and who has the problem. Early-stage teams with a working prototype are a good fit. Applications are reviewed every two weeks.',
   true, null, true),
  ('kathua-agri-ventures-lab-sample', 'Kathua Agri Ventures Lab (Sample)',
   'Agriculture, food processing and rural supply-chain startups.',
   'A sample centre focused on agritech and food processing, with access to a food testing lab and links to farmer producer organisations. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample agricultural institute (fictional)', 'Kathua', 'Kathua', 'Sample address, Kathua',
   'We look for ventures that work directly with growers or food processors. Include any field pilots in your traction section.',
   true, null, true),
  ('udhampur-makers-studio-sample', 'Udhampur Makers Studio (Sample)',
   'Hardware, manufacturing and prototype-heavy ventures.',
   'A sample maker space with 3D printers, electronics benches and a small machine shop for building prototypes. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample engineering college (fictional)', 'Udhampur', 'Udhampur', 'Sample address, Udhampur',
   'Hardware founders at idea or early stage are welcome. Tell us what you need to build and which equipment you need.',
   true, null, true),
  ('trikuta-social-enterprise-centre-sample', 'Trikuta Social Enterprise Centre (Sample)',
   'Social impact, tourism and handicraft ventures in the hill districts.',
   'A sample centre supporting social enterprises, community tourism and handicraft businesses, with a focus on market access. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample management school (fictional)', 'Reasi', 'Katra', 'Sample address, Reasi',
   'Describe the community you work with and how your venture will sustain itself financially.',
   true, null, true),
  ('samba-manufacturing-accelerator-sample', 'Samba Manufacturing Accelerator (Sample)',
   'Established small manufacturers ready to scale.',
   'A sample accelerator for established manufacturing and logistics businesses that want to grow into new markets. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample industry association (fictional)', 'Samba', 'Samba', 'Sample address, Samba',
   'Applications are closed for this cycle. You can still browse the centre and its mentors.',
   false, null, true),
  ('poonch-rural-innovation-centre-sample', 'Poonch Rural Innovation Centre (Sample)',
   'Ideas that improve rural livelihoods, education and healthcare.',
   'A sample centre for first-time founders from rural areas, with mentoring in Hindi, Urdu and English. This is a sample listing used to demonstrate UdyamSetu.',
   'Sample degree college (fictional)', 'Poonch', 'Poonch', 'Sample address, Poonch',
   'No prior experience needed. Tell us about the problem you have seen in your community.',
   true, null, true)
on conflict (slug) do nothing;

-- Supported stages
insert into public.center_stages (center_id, stage_id)
select c.id, st.id
from (values
  ('tawi-innovation-hub-sample', 'ideation'), ('tawi-innovation-hub-sample', 'early_stage'),
  ('kathua-agri-ventures-lab-sample', 'early_stage'), ('kathua-agri-ventures-lab-sample', 'established'),
  ('udhampur-makers-studio-sample', 'ideation'), ('udhampur-makers-studio-sample', 'early_stage'),
  ('trikuta-social-enterprise-centre-sample', 'ideation'), ('trikuta-social-enterprise-centre-sample', 'early_stage'),
  ('samba-manufacturing-accelerator-sample', 'established'),
  ('poonch-rural-innovation-centre-sample', 'ideation')
) as v(slug, stage)
join public.incubation_centers c on c.slug = v.slug
join public.startup_stages st on st.code = v.stage
on conflict do nothing;

-- Sector expertise
insert into public.center_sectors (center_id, sector_id)
select c.id, s.id
from (values
  ('tawi-innovation-hub-sample', 'it-software'), ('tawi-innovation-hub-sample', 'education'),
  ('tawi-innovation-hub-sample', 'financial-services'), ('tawi-innovation-hub-sample', 'ecommerce-retail'),
  ('kathua-agri-ventures-lab-sample', 'agriculture-food-processing'), ('kathua-agri-ventures-lab-sample', 'clean-energy-environment'),
  ('udhampur-makers-studio-sample', 'manufacturing'), ('udhampur-makers-studio-sample', 'clean-energy-environment'),
  ('udhampur-makers-studio-sample', 'healthcare-life-sciences'),
  ('trikuta-social-enterprise-centre-sample', 'tourism-hospitality'), ('trikuta-social-enterprise-centre-sample', 'handicrafts-handloom'),
  ('trikuta-social-enterprise-centre-sample', 'social-impact'),
  ('samba-manufacturing-accelerator-sample', 'manufacturing'), ('samba-manufacturing-accelerator-sample', 'logistics-transport'),
  ('poonch-rural-innovation-centre-sample', 'social-impact'), ('poonch-rural-innovation-centre-sample', 'education'),
  ('poonch-rural-innovation-centre-sample', 'healthcare-life-sciences'), ('poonch-rural-innovation-centre-sample', 'agriculture-food-processing')
) as v(slug, sector)
join public.incubation_centers c on c.slug = v.slug
join public.sectors s on s.slug = v.sector
on conflict do nothing;

-- Support offered
insert into public.center_services (center_id, support_need_id)
select c.id, n.id
from (values
  ('tawi-innovation-hub-sample', 'mentorship'), ('tawi-innovation-hub-sample', 'business-model'),
  ('tawi-innovation-hub-sample', 'technology'), ('tawi-innovation-hub-sample', 'funding-readiness'),
  ('tawi-innovation-hub-sample', 'networking'), ('tawi-innovation-hub-sample', 'workspace'),
  ('kathua-agri-ventures-lab-sample', 'prototype-lab-access'), ('kathua-agri-ventures-lab-sample', 'market-access'),
  ('kathua-agri-ventures-lab-sample', 'mentorship'), ('kathua-agri-ventures-lab-sample', 'legal-compliance'),
  ('udhampur-makers-studio-sample', 'prototype-lab-access'), ('udhampur-makers-studio-sample', 'technology'),
  ('udhampur-makers-studio-sample', 'mentorship'), ('udhampur-makers-studio-sample', 'workspace'),
  ('trikuta-social-enterprise-centre-sample', 'market-access'), ('trikuta-social-enterprise-centre-sample', 'business-model'),
  ('trikuta-social-enterprise-centre-sample', 'networking'), ('trikuta-social-enterprise-centre-sample', 'mentorship'),
  ('samba-manufacturing-accelerator-sample', 'market-access'), ('samba-manufacturing-accelerator-sample', 'funding-readiness'),
  ('samba-manufacturing-accelerator-sample', 'legal-compliance'),
  ('poonch-rural-innovation-centre-sample', 'mentorship'), ('poonch-rural-innovation-centre-sample', 'business-model'),
  ('poonch-rural-innovation-centre-sample', 'networking')
) as v(slug, need)
join public.incubation_centers c on c.slug = v.slug
join public.support_needs n on n.slug = v.need
on conflict do nothing;

-- Mentors and paid college experts (fictional people)
insert into public.center_experts
  (center_id, full_name, headline, organization, bio, expertise_tags, engagement_policy,
   is_paid, fee_inr, session_minutes, offers_online, offers_in_person, in_person_location)
select c.id, v.full_name, v.headline, v.organization, v.bio, v.tags, v.policy::public.engagement_policy,
  v.is_paid, v.fee, v.minutes, v.online, v.in_person, v.location
from (values
  ('tawi-innovation-hub-sample', 'Dr. Asha Verma (Sample)', 'Professor of Computer Science', 'Sample host college (fictional)',
   'Helps software founders plan their architecture and hire their first engineers.',
   array['Software architecture', 'Cloud', 'Hiring'], 'both', true, 1500, 45, true, true, 'Room 12, Tawi Innovation Hub (sample)'),
  ('tawi-innovation-hub-sample', 'Rohan Gupta (Sample)', 'Startup mentor', 'Tawi Innovation Hub (sample)',
   'Former founder who mentors early teams on customer discovery and pricing.',
   array['Customer discovery', 'Pricing', 'Pitching'], 'pre_admission', false, null, 30, true, false, null),
  ('kathua-agri-ventures-lab-sample', 'Dr. Meera Sharma (Sample)', 'Food technology faculty', 'Sample agricultural institute (fictional)',
   'Advises on food safety testing, shelf-life studies and FSSAI paperwork.',
   array['Food safety', 'FSSAI', 'Shelf life'], 'both', true, 1200, 60, true, true, 'Food testing lab, Kathua (sample)'),
  ('kathua-agri-ventures-lab-sample', 'Imran Khan (Sample)', 'Supply-chain mentor', 'Kathua Agri Ventures Lab (sample)',
   'Works with admitted startups on cold-chain logistics and farmer partnerships.',
   array['Cold chain', 'Procurement', 'FPO partnerships'], 'admitted_only', false, null, 45, true, true, 'Kathua Agri Ventures Lab (sample)'),
  ('udhampur-makers-studio-sample', 'Er. Vikram Singh (Sample)', 'Mechanical engineering faculty', 'Sample engineering college (fictional)',
   'Reviews prototype designs and helps choose materials and manufacturing methods.',
   array['Prototyping', 'CAD', 'Materials'], 'both', true, 1000, 60, false, true, 'Workshop B, Udhampur Makers Studio (sample)'),
  ('trikuta-social-enterprise-centre-sample', 'Sunita Devi (Sample)', 'Handicraft market specialist', 'Trikuta Social Enterprise Centre (sample)',
   'Connects craft businesses with buyers, exhibitions and online marketplaces.',
   array['Market access', 'E-commerce listings', 'Exhibitions'], 'both', false, null, 45, true, false, null),
  ('samba-manufacturing-accelerator-sample', 'CA Neha Bhat (Sample)', 'Chartered accountant and visiting faculty', 'Sample industry association (fictional)',
   'Helps established manufacturers with GST, costing and preparing for bank finance.',
   array['GST', 'Costing', 'Bank finance'], 'admitted_only', true, 2000, 60, true, false, null)
) as v(slug, full_name, headline, organization, bio, tags, policy, is_paid, fee, minutes, online, in_person, location)
join public.incubation_centers c on c.slug = v.slug
where not exists (select 1 from public.center_experts e where e.center_id = c.id and e.full_name = v.full_name);

-- Open availability for the next two weeks (weekdays, 10:00 and 15:00 India time).
insert into public.availability_slots (expert_id, starts_at, ends_at)
select e.id, t.starts_at, t.starts_at + make_interval(mins => e.session_minutes)
from public.center_experts e
join public.incubation_centers c on c.id = e.center_id and c.is_sample
cross join lateral (
  select ((d::date + h) at time zone 'Asia/Kolkata') as starts_at
  from generate_series((now() at time zone 'Asia/Kolkata')::date + 1, (now() at time zone 'Asia/Kolkata')::date + 14, interval '1 day') d
  cross join (values (time '10:00'), (time '15:00')) as hours(h)
  where extract(isodow from d) < 6
) t
where not exists (select 1 from public.availability_slots s where s.expert_id = e.id)
on conflict do nothing;
