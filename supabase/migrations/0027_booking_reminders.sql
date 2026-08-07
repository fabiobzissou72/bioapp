-- Customer opt-in for WhatsApp reminders, plus per-reminder sent tracking so
-- the polling cron (triggered externally, e.g. an n8n Schedule node) never
-- double-sends the same reminder.
alter table bookings add column wants_reminder boolean not null default false;
alter table bookings add column reminder_24h_sent_at timestamptz;
alter table bookings add column reminder_1h_sent_at timestamptz;
