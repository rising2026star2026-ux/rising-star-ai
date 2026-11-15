-- Rising Business: الجداول الأساسية (PRD 1.0، القسم 10).
-- المستخدمين بيديرهم Managed Better Auth في سكيمة neon_auth، وإحنا بنربط بالـ id بتاعهم كنص.
-- كل بيانات تجارية مربوطة بنشاط (business)، والوصول بيتحقق على الخادم من عضوية المستخدم في النشاط.
-- الرجوع: 0001_core.down.sql

BEGIN;

CREATE SCHEMA IF NOT EXISTS rb;

-- الأنشطة التجارية (ملف النشاط)
CREATE TABLE rb.businesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      text NOT NULL,                       -- neon_auth user id
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  profile       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- حقول الملف (lib/brandprofile.js cleanBrand)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);
CREATE INDEX businesses_owner_idx ON rb.businesses (owner_id) WHERE archived_at IS NULL;

-- العضوية (فرق العمل لاحقاً): المالك عضو برضه
CREATE TABLE rb.business_members (
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  user_id       text NOT NULL,
  role          text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);
CREATE INDEX business_members_user_idx ON rb.business_members (user_id);

-- المنتجات (المرحلة 4)
CREATE TABLE rb.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category      text,
  description   text,
  unit_cost     numeric(14, 2) CHECK (unit_cost >= 0),
  extra_cost    numeric(14, 2) CHECK (extra_cost >= 0),
  price         numeric(14, 2) CHECK (price >= 0),
  discount_pct  numeric(5, 2) CHECK (discount_pct BETWEEN 0 AND 100),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  images        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_business_idx ON rb.products (business_id);

-- المقارنات والدراسات والتقارير: المحتوى JSON كما هو في الواجهة، وفوقه أعمدة للبحث والترتيب
CREATE TABLE rb.comparisons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  name          text NOT NULL,
  items         jsonb NOT NULL,                      -- الأنشطة المقارنة (lib/bizcompare.js)
  weights       jsonb,                               -- أوزان المعايير (المرحلة 2)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comparisons_business_idx ON rb.comparisons (business_id, updated_at DESC);

CREATE TABLE rb.feasibility_studies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feasibility_business_idx ON rb.feasibility_studies (business_id, updated_at DESC);

-- كل حفظ = إصدار، عشان مقارنة الإصدارات (PRD: إدارة الدراسات)
CREATE TABLE rb.feasibility_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id      uuid NOT NULL REFERENCES rb.feasibility_studies(id) ON DELETE CASCADE,
  version       integer NOT NULL,
  data          jsonb NOT NULL,                      -- { form, data, a, report, field, linked }
  sources_collected_at timestamptz,
  created_by    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, version)
);

CREATE TABLE rb.reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  kind          text NOT NULL,                       -- market | marketing_plan | content | tool_output ...
  title         text NOT NULL,
  body          jsonb NOT NULL,
  tool_id       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_business_idx ON rb.reports (business_id, created_at DESC);

-- بيانات السوق مع تصنيف الجودة (PRD القسم 11)
CREATE TABLE rb.market_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  topic         text NOT NULL,
  value         jsonb NOT NULL,
  source_kind   text NOT NULL CHECK (source_kind IN ('verified', 'user', 'ai_estimate', 'historical', 'unverified')),
  source_name   text,
  source_url    text,
  collected_at  timestamptz,
  verified_at   timestamptz,
  confidence    text CHECK (confidence IN ('high', 'medium', 'low')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX market_data_business_idx ON rb.market_data (business_id, topic);

-- المحادثات مع مساعد الأعمال
CREATE TABLE rb.conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  user_id       text NOT NULL,
  mode          text,
  title         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_business_idx ON rb.conversations (business_id, updated_at DESC);

CREATE TABLE rb.conversation_messages (
  id              bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES rb.conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content         text NOT NULL,
  saved           boolean NOT NULL DEFAULT false,      -- «احفظ في مشروعاتي»
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON rb.conversation_messages (conversation_id, id);

-- ذاكرة منظمة لكل نشاط (PRD 5.6): العميل يراجعها ويحذفها
CREATE TABLE rb.business_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES rb.businesses(id) ON DELETE CASCADE,
  fact          text NOT NULL CHECK (char_length(fact) <= 500),
  source        text NOT NULL DEFAULT 'user',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_memory_idx ON rb.business_memory (business_id);

-- قياس الاستخدام والتكلفة لكل عملية (أساس الحدود والباقات)
CREATE TABLE rb.ai_usage (
  id            bigserial PRIMARY KEY,
  user_id       text,
  business_id   uuid REFERENCES rb.businesses(id) ON DELETE SET NULL,
  operation     text NOT NULL,                       -- section-chat | feasibility | market-check ...
  provider      text,
  units         integer,
  cost_usd      numeric(12, 6),
  ok            boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_time_idx ON rb.ai_usage (user_id, created_at DESC);
CREATE INDEX ai_usage_op_time_idx ON rb.ai_usage (operation, created_at DESC);

-- سجل العمليات المهمة
CREATE TABLE rb.audit_log (
  id            bigserial PRIMARY KEY,
  user_id       text,
  business_id   uuid,
  action        text NOT NULL,
  detail        jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_business_idx ON rb.audit_log (business_id, created_at DESC);

-- رقم إصدار السكيمة
CREATE TABLE rb.schema_migrations (
  version       integer PRIMARY KEY,
  applied_at    timestamptz NOT NULL DEFAULT now()
);
INSERT INTO rb.schema_migrations (version) VALUES (1);

COMMIT;
