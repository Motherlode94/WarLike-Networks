# Session-scoped Push revocation
POST /api/push-revoke-session with JSON {"app":"chat"} or telecom. Requires authenticated same-origin session. Deletes only matching user, app and SHA-256 session hash. Idempotent; no endpoint or token exposed. Call before central logout. Existing device-specific unsubscribe remains available. Delivery still requires authoritative central session verification.
