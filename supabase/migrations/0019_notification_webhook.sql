-- Optional webhook the agency/business can point at their own automation
-- (n8n, Zapier, Evolution API, etc) to get notified on new/cancelled
-- bookings — we never talk to WhatsApp directly, just fire a POST.
alter table biosites add column notification_webhook_url text;
