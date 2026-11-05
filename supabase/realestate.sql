-- الباحث العقاري: قاعدة البيانات في Supabase (Postgres).
-- التشغيل: افتح مشروعك في Supabase ← SQL Editor ← الزق الملف ده كله ← Run. الملف آمن لو اتشغّل أكتر من مرة.
-- بعدها حط في Vercel (بالأسماء دي): SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY.
-- القاعدة الأساسية: الأسعار ما بتتمسحش. أي تغيير في سعر وحدة بيضيف صف في price_history أوتوماتيك.

create extension if not exists pgcrypto;

-- ===== المصادر =====
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('official','developer','broker','portal','user','estimate')),
  name text not null,
  url text,
  terms text,                       -- شروط الاستخدام أو الاتفاق
  trust char(1) not null default 'D' check (trust in ('A','B','C','D','E')),
  created_at timestamptz not null default now()
);
create unique index if not exists sources_kind_name on sources (kind, name);

-- ===== المطورين =====
create table if not exists developers (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  website text,
  founded_year int,
  listed_egx boolean,
  delivered_projects int,
  delay_notes text,
  sources jsonb not null default '[]',   -- [{url, title, date}]
  updated_at timestamptz not null default now()
);
create unique index if not exists developers_name on developers (lower(name_ar));

-- ===== المشاريع =====
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references developers(id) on delete set null,
  name text not null,
  governorate text,
  city text,
  district text,
  lat double precision,
  lng double precision,
  kind text,                          -- كمبوند، مدينة، مول، إداري
  launch_date date,
  delivery_date date,
  status text,                        -- طرح، تحت الإنشاء، اتسلّم
  official_url text,
  updated_at timestamptz not null default now()
);

-- ===== المنظمات والحسابات (وسطاء ومطورين) =====
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('broker','developer')),
  license_no text,
  verified boolean not null default false,
  phone text,
  created_at timestamptz not null default now()
);
create table if not exists profiles (
  user_id uuid primary key,           -- auth.users.id
  org_id uuid references organizations(id) on delete set null,
  role text not null default 'user' check (role in ('user','broker','developer','admin')),
  plan text not null default 'basic' check (plan in ('basic','pro','investor','partner')),
  created_at timestamptz not null default now()
);

-- ===== الوحدات =====
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  source_id uuid references sources(id) on delete set null,
  org_id uuid references organizations(id) on delete set null,
  mode text not null default 'sale' check (mode in ('sale','rent')),
  unit_type text,                     -- شقة، فيلا، دوبلكس، محل...
  governorate text,
  city text,
  district text,
  area_m2 numeric,
  rooms int,
  floor text,
  finishing text,
  availability text default 'available',
  price_total numeric,                -- للإيجار: الإيجار الشهري
  price_per_m2 numeric generated always as (case when area_m2 > 0 and price_total > 0 then round(price_total / area_m2) end) stored,
  down_payment_pct numeric,
  installment_amount numeric,
  installment_years numeric,
  installment_per_year int,
  maintenance_pct numeric,
  delivery_date date,
  source_url text,
  source_kind text not null default 'portal' check (source_kind in ('official','developer','broker','portal','user','estimate')),
  confidence char(1) not null default 'D' check (confidence in ('A','B','C','D','E')),
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved boolean not null default true,
  created_by uuid
);
create unique index if not exists units_source_url on units (source_url) where source_url is not null;
create index if not exists units_area on units (city, district, unit_type, mode);

-- ===== سجل الأسعار (إضافة بس) =====
create table if not exists price_history (
  id bigserial primary key,
  unit_id uuid not null references units(id) on delete cascade,
  price_total numeric,
  price_per_m2 numeric,
  plan jsonb,
  observed_at timestamptz not null default now(),
  source_url text,
  source_kind text,
  confidence char(1)
);
create index if not exists price_history_unit on price_history (unit_id, observed_at desc);

create or replace function touch_unit() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists units_touch on units;
create trigger units_touch before update on units
  for each row execute function touch_unit();

create or replace function log_unit_price() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.price_total is distinct from old.price_total
     or new.down_payment_pct is distinct from old.down_payment_pct
     or new.installment_years is distinct from old.installment_years then
    insert into price_history (unit_id, price_total, price_per_m2, plan, source_url, source_kind, confidence)
    values (new.id, new.price_total, new.price_per_m2,
            jsonb_build_object('down', new.down_payment_pct, 'years', new.installment_years, 'each', new.installment_amount, 'maintenance', new.maintenance_pct),
            new.source_url, new.source_kind, new.confidence);
  end if;
  return null;
end $$;
drop trigger if exists units_price_log on units;
create trigger units_price_log after insert or update on units
  for each row execute function log_unit_price();

-- سجل الأسعار ممنوع يتعدّل أو يتمسح
create or replace function deny_change() returns trigger language plpgsql as $$
begin raise exception 'price_history is append-only'; end $$;
drop trigger if exists price_history_lock on price_history;
create trigger price_history_lock before update or delete on price_history
  for each row execute function deny_change();

-- ===== مؤشرات المناطق (آخر 90 يوم) =====
create or replace view area_stats as
select city, district, unit_type, mode,
       count(*) as samples,
       percentile_cont(0.25) within group (order by price_per_m2) as ppm_low,
       percentile_cont(0.5)  within group (order by price_per_m2) as ppm_mid,
       percentile_cont(0.75) within group (order by price_per_m2) as ppm_high,
       percentile_cont(0.5)  within group (order by price_total)  as price_mid,
       max(collected_at) as last_seen
from units
where approved and collected_at > now() - interval '90 days' and price_total > 0
group by city, district, unit_type, mode;

-- ===== الاستخدام والتكلفة =====
create table if not exists usage (
  id bigserial primary key,
  user_id uuid,
  ip_hash text,
  op text not null,                   -- chat, report, doc, gather
  model text,
  usd numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists usage_day on usage (created_at);

-- ===== التقارير =====
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  input jsonb not null,
  facts text,
  sections jsonb,
  sources jsonb,
  created_at timestamptz not null default now()
);

-- ===== الصلاحيات (Row Level Security) =====
-- السيرفر بيستخدم service role فبيعدّي من RLS. الزوار والوسطاء بالمفتاح العام بيتقيّدوا بالقواعد دي.
alter table units enable row level security;
alter table price_history enable row level security;
alter table developers enable row level security;
alter table projects enable row level security;
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table usage enable row level security;
alter table reports enable row level security;
alter table sources enable row level security;

drop policy if exists units_read on units;
create policy units_read on units for select using (approved);
drop policy if exists units_broker_write on units;
create policy units_broker_write on units for all
  using (org_id in (select org_id from profiles where user_id = auth.uid() and role in ('broker','developer')))
  with check (org_id in (select org_id from profiles where user_id = auth.uid() and role in ('broker','developer')));
drop policy if exists ph_read on price_history;
create policy ph_read on price_history for select using (true);
drop policy if exists dev_read on developers;
create policy dev_read on developers for select using (true);
drop policy if exists proj_read on projects;
create policy proj_read on projects for select using (true);
drop policy if exists src_read on sources;
create policy src_read on sources for select using (true);
drop policy if exists profile_self on profiles;
create policy profile_self on profiles for select using (user_id = auth.uid());
drop policy if exists reports_self on reports;
create policy reports_self on reports for select using (user_id = auth.uid());
