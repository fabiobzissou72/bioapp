-- Recurring monthly payment tracking: instead of a status stuck on "pago"
-- forever, track the date coverage runs out through, so the super admin UI
-- can compute pago/vencendo/atrasado automatically and remind Fabio to
-- update it each month.
alter table biosites add column paid_until date;

-- Preserve existing "pago" rows as covered through today so they don't
-- suddenly look overdue after this migration.
update biosites set paid_until = current_date where payment_status = 'pago';
