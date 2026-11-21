CREATE TABLE IF NOT EXISTS network_members(user_id TEXT PRIMARY KEY, display_name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS network_lines(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES network_members(user_id), created_at INTEGER NOT NULL, revoked_at INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS network_active_line ON network_lines(user_id) WHERE revoked_at IS NULL;
