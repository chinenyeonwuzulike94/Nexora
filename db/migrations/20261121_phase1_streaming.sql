-- Phase 1 streaming foundation. Existing auth tables are retained.
CREATE TABLE IF NOT EXISTS nexora_profiles (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
 name VARCHAR(60) NOT NULL,
 avatar_url TEXT,
 is_kids BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_profiles_user_idx ON nexora_profiles(user_id);
CREATE TABLE IF NOT EXISTS nexora_genres (
 id TEXT PRIMARY KEY,
 name VARCHAR(60) NOT NULL UNIQUE,
 slug VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS nexora_content (
 id TEXT PRIMARY KEY,
 content_type VARCHAR(16) NOT NULL CHECK (content_type IN ('movie','series')),
 title VARCHAR(180) NOT NULL,
 synopsis TEXT NOT NULL DEFAULT '',
 release_year SMALLINT CHECK (release_year IS NULL OR release_year BETWEEN 1888 AND 2200),
 age_rating VARCHAR(16),
 original_language VARCHAR(12),
 production_country CHAR(2),
 status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
 created_by TEXT REFERENCES nexora_users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_content_type_status_idx ON nexora_content(content_type,status);
CREATE INDEX IF NOT EXISTS nexora_content_title_search_idx ON nexora_content USING GIN (to_tsvector('simple', title || ' ' || synopsis));
CREATE TABLE IF NOT EXISTS nexora_content_genres (
 content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 genre_id TEXT NOT NULL REFERENCES nexora_genres(id) ON DELETE CASCADE,
 PRIMARY KEY(content_id,genre_id)
);
CREATE TABLE IF NOT EXISTS nexora_seasons (
 id TEXT PRIMARY KEY,
 series_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 season_number SMALLINT NOT NULL CHECK (season_number > 0),
 title VARCHAR(180),
 synopsis TEXT NOT NULL DEFAULT '',
 UNIQUE(series_id,season_number)
);
CREATE TABLE IF NOT EXISTS nexora_episodes (
 id TEXT PRIMARY KEY,
 season_id TEXT NOT NULL REFERENCES nexora_seasons(id) ON DELETE CASCADE,
 episode_number SMALLINT NOT NULL CHECK (episode_number > 0),
 title VARCHAR(180) NOT NULL,
 synopsis TEXT NOT NULL DEFAULT '',
 runtime_seconds INTEGER CHECK (runtime_seconds IS NULL OR runtime_seconds > 0),
 UNIQUE(season_id,episode_number)
);
CREATE TABLE IF NOT EXISTS nexora_content_rights (
 id TEXT PRIMARY KEY,
 content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 territory CHAR(2) NOT NULL,
 license_reference VARCHAR(180) NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL,
 expires_at TIMESTAMPTZ,
 svod_allowed BOOLEAN NOT NULL DEFAULT FALSE,
 avod_allowed BOOLEAN NOT NULL DEFAULT FALSE,
 status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (expires_at IS NULL OR expires_at > starts_at),
 UNIQUE(content_id,territory,license_reference)
);
CREATE INDEX IF NOT EXISTS nexora_content_rights_lookup_idx ON nexora_content_rights(content_id,territory,status,starts_at,expires_at);
CREATE TABLE IF NOT EXISTS nexora_playback_assets (
 id TEXT PRIMARY KEY,
 content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 asset_type VARCHAR(16) NOT NULL CHECK (asset_type IN ('hls','dash','mp4','poster','backdrop','trailer','subtitle')),
 storage_key TEXT NOT NULL,
 mime_type VARCHAR(120),
 duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
 status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','disabled')),
 drm_required BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(content_id,asset_type,storage_key)
);
CREATE TABLE IF NOT EXISTS nexora_watchlists (
 user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
 profile_id TEXT REFERENCES nexora_profiles(id) ON DELETE CASCADE,
 content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,profile_id,content_id)
);
CREATE INDEX IF NOT EXISTS nexora_watchlists_content_idx ON nexora_watchlists(content_id);
CREATE TABLE IF NOT EXISTS nexora_watch_history (
 user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
 profile_id TEXT REFERENCES nexora_profiles(id) ON DELETE CASCADE,
 content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
 position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
 duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
 completed BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,profile_id,content_id)
);
CREATE INDEX IF NOT EXISTS nexora_watch_history_recent_idx ON nexora_watch_history(user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS nexora_admin_roles (
 user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
 role VARCHAR(24) NOT NULL CHECK (role IN ('admin','catalog_editor','rights_manager','moderator')),
 granted_by TEXT REFERENCES nexora_users(id) ON DELETE SET NULL,
 granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,role)
);
