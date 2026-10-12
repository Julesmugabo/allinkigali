-- 041_news_authors_ads_v2.sql
-- News admin: authors/bylines, article scheduling + SEO fields,
-- advertisers, campaigns, ad placements, impression/click events,
-- and workflow settings.

-- ── Authors ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_authors (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'reporter', -- reporter | editor | contributor
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Article schema additions ──────────────────────────────────────────────────
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_id       INT REFERENCES news_authors(id) ON DELETE SET NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS publish_at      TIMESTAMPTZ;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS slug            TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS og_image        TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS breaking_expires_at TIMESTAMPTZ;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_sponsored    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS read_time_min   SMALLINT;  -- estimated minutes
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS shares          INT NOT NULL DEFAULT 0;

-- ── Advertisers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_advertisers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  logo_url    TEXT,
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Campaigns ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_campaigns (
  id              SERIAL PRIMARY KEY,
  advertiser_id   INT NOT NULL REFERENCES news_advertisers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  budget          NUMERIC(12,2),
  spent           NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at       DATE,
  ends_at         DATE,
  status          TEXT NOT NULL DEFAULT 'draft', -- draft | active | paused | ended
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Ad placements (ties existing ads table to campaigns) ─────────────────────
CREATE TABLE IF NOT EXISTS news_ad_placements (
  id            SERIAL PRIMARY KEY,
  campaign_id   INT NOT NULL REFERENCES news_campaigns(id) ON DELETE CASCADE,
  ad_id         TEXT,  -- references ads.id (stored as text to avoid FK type mismatch)
  placement     TEXT NOT NULL DEFAULT 'feed', -- feed | banner | sidebar | breaking
  cpm           NUMERIC(10,4) NOT NULL DEFAULT 0, -- cost per mille
  max_impressions INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Impression / click events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_ad_events (
  id            BIGSERIAL PRIMARY KEY,
  placement_id  INT NOT NULL REFERENCES news_ad_placements(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL, -- impression | click
  article_id    INT,  -- soft reference to news_articles; no FK to avoid type mismatch
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Workflow settings (single-row config) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_workflow_settings (
  id                          INT PRIMARY KEY DEFAULT 1,
  breaking_expiry_hours       SMALLINT NOT NULL DEFAULT 6,
  scheduled_check_interval    SMALLINT NOT NULL DEFAULT 5,  -- minutes
  require_editor_approval     BOOLEAN NOT NULL DEFAULT false,
  default_publish_status      TEXT NOT NULL DEFAULT 'draft',
  ad_frequency_every_n        SMALLINT NOT NULL DEFAULT 5,  -- show ad every N articles
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- seed default workflow settings row
INSERT INTO news_workflow_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
