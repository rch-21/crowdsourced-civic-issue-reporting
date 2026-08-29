-- Phase 16: provider-neutral notifications, preferences and i18n.
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(80) NOT NULL,
  channel varchar(20) NOT NULL CHECK (channel IN ('PUSH','EMAIL','SMS','WHATSAPP','IVR')),
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,event_type,channel)
);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(80) NOT NULL,
  channel varchar(20) NOT NULL CHECK (channel IN ('PUSH','EMAIL','SMS','WHATSAPP','IVR')),
  dedupe_key varchar(255) NOT NULL,
  title_key varchar(160) NOT NULL,
  body_key varchar(160) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FAILED','SKIPPED')),
  provider_message_id varchar(255),
  error_code varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe ON notifications(user_id,event_type,channel,dedupe_key);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS user_locales (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  locale varchar(10) NOT NULL DEFAULT 'en',
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE notifications IS 'Provider-neutral notification outbox. Delivery adapters live outside business logic.';
COMMENT ON TABLE notification_preferences IS 'Per-user event/channel preferences; disabled channels are skipped.';
