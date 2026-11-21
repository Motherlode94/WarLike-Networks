CREATE TABLE network_meetings(id TEXT PRIMARY KEY,title TEXT NOT NULL,host_id TEXT NOT NULL REFERENCES network_members(user_id),created_at INTEGER NOT NULL,closed_at INTEGER);
CREATE TABLE network_meeting_invites(meeting_id TEXT NOT NULL REFERENCES network_meetings(id),user_id TEXT NOT NULL REFERENCES network_members(user_id),PRIMARY KEY(meeting_id,user_id));
CREATE INDEX network_meeting_invites_user ON network_meeting_invites(user_id);
