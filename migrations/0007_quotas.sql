CREATE TABLE network_quotas(user_id TEXT NOT NULL REFERENCES network_members(user_id),kind TEXT NOT NULL CHECK(kind IN ('call','message')),bucket INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(user_id,kind,bucket));
CREATE INDEX network_quotas_bucket ON network_quotas(bucket);
