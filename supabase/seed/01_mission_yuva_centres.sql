-- Incubation centres named in public reports as part of the Mission YUVA incubation network
-- in Jammu and Kashmir.
--
-- Sources (each centre row also stores its own source link, shown on its page):
--   * JK Monitor, 26 Nov 2025: "IIM Jammu leads Mission YUVA Orientation, unites J&K's 14
--     Incubation Centres" - names the centres at IIT Jammu, SKUAST Jammu, SMVDU, BGSBU,
--     Central University of Jammu, University of Jammu, SKUAST Kashmir, University of Kashmir,
--     IUST, NIFT Srinagar and NIT Srinagar.
--   * Greater Kashmir, 8 Sep 2026: J&K Govt, IIM Jammu and NIT Srinagar MoU - IIM Jammu anchors
--     the YUVA Innovation Hubs; NIT Srinagar's Greenovator Incubation Foundation becomes a
--     regional incubation node.
-- Reports mention 14 centres but name only these 12, so only these 12 are listed. The master
-- admin can add the others from the admin dashboard once they are confirmed.
--
-- Only facts from those sources and each institution's public identity are filled in.
-- Programmes, sectors, stages, mentors and intake are left for each centre's own staff to add.
-- Applications stay closed on UdyamSetu until the centre's staff join and open them.
--
-- UdyamSetu is independent: these listings do not claim any partnership with Mission YUVA,
-- the Government of J&K or the institutions. Safe to run more than once.

insert into public.incubation_centers
  (slug, name, short_description, description, host_institution, district, city, website,
   application_guidance, accepting_applications, is_sample, source_label, source_url)
select v.slug, v.name, v.short_description,
  v.name || ' is one of the incubation centres named in public reports as part of the Mission YUVA incubation network in Jammu and Kashmir. '
    || 'Its programmes, focus sectors and mentors will appear here once the centre''s team adds them.',
  v.host, v.district, v.city, v.website,
  'This centre hasn''t opened applications on UdyamSetu yet. You can contact it through its own website in the meantime, and complete your venture profile so you''re ready to apply as soon as it opens.',
  false, false, v.source_label, v.source_url
from (values
  ('iim-jammu', 'IIM Jammu Incubation Centre', 'Incubation at the Indian Institute of Management Jammu, which anchors the YUVA Innovation Hubs.',
   'Indian Institute of Management Jammu', 'Jammu', 'Jammu', 'https://incubation.iimj.ac.in',
   'Greater Kashmir, 8 Sep 2026: J&K Govt, IIM Jammu, NIT Srinagar sign MoU under Mission YUVA',
   'https://www.greaterkashmir.com/business/jk-govt-iim-jammu-nit-srinagar-sign-mou-to-boost-startup-ecosystem-under-mission-yuva-12505146'),
  ('iit-jammu', 'IIT Jammu Incubation Centre', 'Incubation at the Indian Institute of Technology Jammu.',
   'Indian Institute of Technology Jammu', 'Jammu', 'Jammu', 'https://www.iitjammu.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('skuast-jammu', 'SKUAST Jammu Incubation Centre', 'Incubation at Sher-e-Kashmir University of Agricultural Sciences and Technology of Jammu.',
   'Sher-e-Kashmir University of Agricultural Sciences and Technology of Jammu', 'Jammu', 'Jammu', 'https://skuast.org',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('smvdu-katra', 'SMVDU Incubation Centre', 'Incubation at Shri Mata Vaishno Devi University, Katra.',
   'Shri Mata Vaishno Devi University', 'Reasi', 'Katra', 'https://www.smvdu.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('bgsbu-rajouri', 'BGSBU Incubation Centre', 'Incubation at Baba Ghulam Shah Badshah University, Rajouri.',
   'Baba Ghulam Shah Badshah University', 'Rajouri', 'Rajouri', 'https://www.bgsbu.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('central-university-of-jammu', 'Central University of Jammu Incubation Centre', 'Incubation at the Central University of Jammu.',
   'Central University of Jammu', 'Samba', 'Samba', 'https://www.cujammu.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('university-of-jammu', 'University of Jammu Incubation Centre', 'Incubation at the University of Jammu.',
   'University of Jammu', 'Jammu', 'Jammu', 'https://www.jammuuniversity.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('skuast-kashmir', 'SKUAST Kashmir Incubation Centre', 'Incubation at Sher-e-Kashmir University of Agricultural Sciences and Technology of Kashmir.',
   'Sher-e-Kashmir University of Agricultural Sciences and Technology of Kashmir', 'Srinagar', 'Srinagar', 'https://www.skuastkashmir.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('university-of-kashmir', 'University of Kashmir Incubation Centre', 'Incubation at the University of Kashmir.',
   'University of Kashmir', 'Srinagar', 'Srinagar', 'https://www.kashmiruniversity.net',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('iust-awantipora', 'IUST Incubation Centre', 'Incubation at the Islamic University of Science and Technology, Awantipora.',
   'Islamic University of Science and Technology', 'Pulwama', 'Awantipora', 'https://www.iust.ac.in',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('nift-srinagar', 'NIFT Srinagar Incubation Centre', 'Incubation at the National Institute of Fashion Technology, Srinagar.',
   'National Institute of Fashion Technology, Srinagar', 'Budgam', 'Srinagar', 'https://www.nift.ac.in/srinagar',
   'JK Monitor, 26 Nov 2025: Mission YUVA orientation of J&K''s incubation centres', null),
  ('nit-srinagar-greenovator', 'Greenovator Incubation Foundation, NIT Srinagar', 'Incubation at the National Institute of Technology Srinagar, a regional incubation node for Kashmir.',
   'National Institute of Technology Srinagar', 'Srinagar', 'Srinagar', 'https://nitsri.ac.in',
   'Greater Kashmir, 8 Sep 2026: J&K Govt, IIM Jammu, NIT Srinagar sign MoU under Mission YUVA',
   'https://www.greaterkashmir.com/business/jk-govt-iim-jammu-nit-srinagar-sign-mou-to-boost-startup-ecosystem-under-mission-yuva-12505146')
) as v(slug, name, short_description, host, district, city, website, source_label, source_url)
on conflict (slug) do nothing;

-- The orientation report is the source for the eleven centres above without their own link.
update public.incubation_centers
set source_url = 'https://jkmonitor.org/index.php/iim-jammu-leads-mission-yuva-orientation-unites-j-ks-14-incubation-centres-to-boost-youth-innovation-and-startup-ecosystem'
where source_url is null and source_label like 'JK Monitor, 26 Nov 2025%';
