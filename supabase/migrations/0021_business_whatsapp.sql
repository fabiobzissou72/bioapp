-- The business's own WhatsApp number, so the webhook payload tells the
-- receiving automation (n8n, etc) which number to notify — separate from
-- the customer's phone number already in the payload.
alter table biosites add column business_whatsapp text;
