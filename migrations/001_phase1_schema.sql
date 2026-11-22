-- Nexora Phase 1 PostgreSQL schema.
-- Idempotent baseline for Neon. Apply once to the intended database before
-- enabling catalogue administration, profiles, rights checks or watch history.

CREATE TABLE IF NOT EXISTS nexora_users (
  id TEXT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  salt CHAR(32) NOT NULL,
  hash CHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nexora_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_sessions_expiry_idx ON nexora_sessions (expires_at);

CREATE TABLE IF NOT EXISTS nexora_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
  name VARCHAR(60) NOT NULL,
  avatar_url TEXT,
  is_kids BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_profiles_user_idx ON nexora_profiles (user_id, created_at);

CREATE TABLE IF NOT EXISTS nexora_admin_roles (
  user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','catalog_editor','rights_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS nexora_content (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie','series')),
  title VARCHAR(180) NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  release_year INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by TEXT REFERENCES nexora_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_content_status_updated_idx ON nexora_content (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS nexora_content_rights (
  id CHAR(24) PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  territory CHAR(2) NOT NULL,
  license_reference VARCHAR(180) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  svod_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  avod_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  demo_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);
CREATE INDEX IF NOT EXISTS nexora_content_rights_lookup_idx ON nexora_content_rights (content_id, territory, status);

CREATE TABLE IF NOT EXISTS nexora_playback_assets (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_playback_assets_content_idx ON nexora_playback_assets (content_id, status);

CREATE TABLE IF NOT EXISTS nexora_genres (
  id TEXT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS nexora_content_genres (
  content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES nexora_genres(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, genre_id)
);

CREATE TABLE IF NOT EXISTS nexora_watchlists (
  user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id)
);
CREATE INDEX IF NOT EXISTS nexora_watchlists_recent_idx ON nexora_watchlists (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nexora_watch_history (
  user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES nexora_profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL REFERENCES nexora_content(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, profile_id, content_id)
);
CREATE INDEX IF NOT EXISTS nexora_watch_history_recent_idx ON nexora_watch_history (user_id, profile_id, updated_at DESC);
