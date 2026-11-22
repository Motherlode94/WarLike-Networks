CREATE TABLE network_push_subscriptions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES network_members(user_id),app TEXT NOT NULL CHECK(app IN ('telecom','chat')),endpoint TEXT NOT NULL UNIQUE,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER);
CREATE INDEX network_push_user ON network_push_subscriptions(user_id,app);
