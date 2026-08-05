-- Per-date exceptions on top of the weekly recurring availability pattern,
-- e.g. "block the whole day on Aug 15" or "close at 14:00 today only".
create table availability_overrides (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  blocked_hours int[] not null default '{}',
  full_day_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (staff_id, date)
);
create index availability_overrides_staff_date_idx on availability_overrides(staff_id, date);

alter table availability_overrides enable row level security;

create policy "availability_overrides_owner_all" on availability_overrides for all
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability_overrides.staff_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability_overrides.staff_id and b.owner_id = auth.uid()));
create policy "availability_overrides_public_read" on availability_overrides for select
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability_overrides.staff_id and b.published = true));
