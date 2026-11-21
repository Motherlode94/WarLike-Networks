CREATE TABLE IF NOT EXISTS network_calls(id TEXT PRIMARY KEY,caller INTEGER NOT NULL REFERENCES network_lines(id),callee INTEGER NOT NULL REFERENCES network_lines(id),state TEXT NOT NULL CHECK(state IN ('ringing','accepted','declined','ended')),created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS network_calls_caller ON network_calls(caller,expires_at);
CREATE INDEX IF NOT EXISTS network_calls_callee ON network_calls(callee,expires_at);
