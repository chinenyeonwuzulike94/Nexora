-- Phase 1 additions for series metadata and the licensed player preview.
-- Apply after 001_phase1_schema.sql and 002_rights_audit.sql.

ALTER TABLE nexora_content ADD COLUMN IF NOT EXISTS age_rating VARCHAR(16);
ALTER TABLE nexora_content ADD COLUMN IF NOT EXISTS original_language VARCHAR(12);
ALTER TABLE nexora_content ADD COLUMN IF NOT EXISTS production_country CHAR(2);

CREATE TABLE IF NOT EXISTS nexora_seasons (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  season_number SMALLINT NOT NULL CHECK (season_number > 0),
  title VARCHAR(180),
  synopsis TEXT NOT NULL DEFAULT '',
  UNIQUE (series_id, season_number)
);

CREATE TABLE IF NOT EXISTS nexora_episodes (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES nexora_seasons(id) ON DELETE CASCADE,
  episode_number SMALLINT NOT NULL CHECK (episode_number > 0),
  title VARCHAR(180) NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  runtime_seconds INTEGER CHECK (runtime_seconds IS NULL OR runtime_seconds > 0),
  UNIQUE (season_id, episode_number)
);

ALTER TABLE nexora_playback_assets ADD COLUMN IF NOT EXISTS drm_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE nexora_content_rights ADD COLUMN IF NOT EXISTS demo_allowed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE nexora_playback_assets DROP CONSTRAINT IF EXISTS nexora_playback_assets_asset_type_check;
ALTER TABLE nexora_playback_assets ADD CONSTRAINT nexora_playback_assets_asset_type_check
  CHECK (asset_type IN ('hls','dash','mp4','webm','poster','backdrop','trailer','subtitle'));

INSERT INTO nexora_content
  (id,content_type,title,synopsis,release_year,original_language,production_country,status)
VALUES
  ('big-buck-bunny-demo','movie','Big Buck Bunny · Player Preview','A short, openly licensed animation clip used to demonstrate Nexora playback controls.',2008,'en','NL','published')
ON CONFLICT (id) DO UPDATE
  SET synopsis=EXCLUDED.synopsis,release_year=EXCLUDED.release_year,
      original_language=EXCLUDED.original_language,production_country=EXCLUDED.production_country,
      status='published',updated_at=NOW();

INSERT INTO nexora_content_rights
  (id,content_id,territory,license_reference,starts_at,svod_allowed,avod_allowed,demo_allowed,status)
SELECT
  'bbbbbbbbbbbbbbbbbbbbbbbb','big-buck-bunny-demo','NG',
  'CC BY 3.0 · Blender Foundation · peach.blender.org/about',
  '2008-05-30T00:00:00Z',FALSE,FALSE,TRUE,'active'
WHERE NOT EXISTS (
  SELECT 1 FROM nexora_content_rights
  WHERE content_id='big-buck-bunny-demo' AND territory='NG'
    AND license_reference='CC BY 3.0 · Blender Foundation · peach.blender.org/about'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nexora_playback_assets
  (id,content_id,asset_type,storage_key,mime_type,duration_seconds,status,drm_required)
VALUES
  ('bbb-demo-av1','big-buck-bunny-demo','webm','https://download.blender.org/demo/movies/BBB/bbb_1080p_10s_5MB_av1.webm','video/webm',10,'ready',FALSE),
  ('bbb-demo-mp4','big-buck-bunny-demo','mp4','https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4','video/mp4',10,'ready',FALSE)
ON CONFLICT (id) DO UPDATE
  SET storage_key=EXCLUDED.storage_key,mime_type=EXCLUDED.mime_type,
      duration_seconds=EXCLUDED.duration_seconds,status='ready',drm_required=FALSE;
