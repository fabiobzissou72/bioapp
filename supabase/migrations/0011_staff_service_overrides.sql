-- Optional per-staff overrides on top of a service's default price/duration.
alter table staff_services add column price_override numeric(10,2);
alter table staff_services add column duration_override int;
