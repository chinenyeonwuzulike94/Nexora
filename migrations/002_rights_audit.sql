-- Add append-only status history for licence review actions.
CREATE TABLE IF NOT EXISTS nexora_rights_audit (
  id TEXT PRIMARY KEY,
  right_id CHAR(24) NOT NULL REFERENCES nexora_content_rights(id) ON DELETE CASCADE,
  changed_by TEXT REFERENCES nexora_users(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL CHECK (previous_status IN ('pending','active','revoked')),
  new_status TEXT NOT NULL CHECK (new_status IN ('pending','active','revoked')),
  note VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nexora_rights_audit_recent_idx ON nexora_rights_audit (right_id, created_at DESC);
