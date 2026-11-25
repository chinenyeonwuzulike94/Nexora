-- Persistent ordering for the non-empty homepage catalogue shelves.
-- The application creates this table lazily as well, so existing Neon databases
-- can deploy without a manual schema change. Apply this migration for an explicit
-- and reproducible Phase 1 schema.

CREATE TABLE IF NOT EXISTS nexora_homepage_sections (
  section_key TEXT PRIMARY KEY,
  position SMALLINT NOT NULL CHECK (position > 0),
  updated_by TEXT REFERENCES nexora_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO nexora_homepage_sections (section_key, position) VALUES
  ('featured-scifi', 1),
  ('action', 2),
  ('thrillers', 3),
  ('continue-watching', 4),
  ('top-rated', 5),
  ('recently-added', 6),
  ('african-cinema', 7),
  ('nollywood', 8),
  ('tv-series', 9),
  ('recommended', 10),
  ('horror', 11),
  ('romance', 12),
  ('comedy', 13),
  ('documentaries', 14),
  ('animation', 15),
  ('family', 16)
ON CONFLICT (section_key) DO NOTHING;
