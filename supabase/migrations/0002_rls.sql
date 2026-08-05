-- Row Level Security
alter table profiles enable row level security;
alter table biosites enable row level security;
alter table buttons enable row level security;
alter table catalog_groups enable row level security;
alter table catalog_items enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_services enable row level security;
alter table availability enable row level security;
alter table bookings enable row level security;
alter table clicks enable row level security;
alter table client_access enable row level security;

-- profiles: owner can read/update their own row
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

-- biosites: owner has full control; anon/public can read published sites
create policy "biosites_owner_all" on biosites for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "biosites_public_read" on biosites for select using (published = true);

-- buttons: owner full control via parent biosite; public read
create policy "buttons_owner_all" on buttons for all
  using (exists (select 1 from biosites b where b.id = buttons.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = buttons.biosite_id and b.owner_id = auth.uid()));
create policy "buttons_public_read" on buttons for select
  using (exists (select 1 from biosites b where b.id = buttons.biosite_id and b.published = true));

-- catalog_groups
create policy "catalog_groups_owner_all" on catalog_groups for all
  using (exists (select 1 from biosites b where b.id = catalog_groups.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = catalog_groups.biosite_id and b.owner_id = auth.uid()));
create policy "catalog_groups_public_read" on catalog_groups for select
  using (exists (select 1 from biosites b where b.id = catalog_groups.biosite_id and b.published = true));

-- catalog_items
create policy "catalog_items_owner_all" on catalog_items for all
  using (exists (select 1 from catalog_groups g join biosites b on b.id = g.biosite_id where g.id = catalog_items.group_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from catalog_groups g join biosites b on b.id = g.biosite_id where g.id = catalog_items.group_id and b.owner_id = auth.uid()));
create policy "catalog_items_public_read" on catalog_items for select
  using (exists (select 1 from catalog_groups g join biosites b on b.id = g.biosite_id where g.id = catalog_items.group_id and b.published = true));

-- services
create policy "services_owner_all" on services for all
  using (exists (select 1 from biosites b where b.id = services.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = services.biosite_id and b.owner_id = auth.uid()));
create policy "services_public_read" on services for select
  using (exists (select 1 from biosites b where b.id = services.biosite_id and b.published = true));

-- staff
create policy "staff_owner_all" on staff for all
  using (exists (select 1 from biosites b where b.id = staff.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = staff.biosite_id and b.owner_id = auth.uid()));
create policy "staff_public_read" on staff for select
  using (exists (select 1 from biosites b where b.id = staff.biosite_id and b.published = true));

-- staff_services
create policy "staff_services_owner_all" on staff_services for all
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = staff_services.staff_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = staff_services.staff_id and b.owner_id = auth.uid()));
create policy "staff_services_public_read" on staff_services for select
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = staff_services.staff_id and b.published = true));

-- availability
create policy "availability_owner_all" on availability for all
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability.staff_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability.staff_id and b.owner_id = auth.uid()));
create policy "availability_public_read" on availability for select
  using (exists (select 1 from staff s join biosites b on b.id = s.biosite_id where s.id = availability.staff_id and b.published = true));

-- bookings: owner can see/manage all bookings for their biosites; public (anon) can create a booking
create policy "bookings_owner_all" on bookings for all
  using (exists (select 1 from biosites b where b.id = bookings.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = bookings.biosite_id and b.owner_id = auth.uid()));
create policy "bookings_public_insert" on bookings for insert
  with check (exists (select 1 from biosites b where b.id = bookings.biosite_id and b.published = true));

-- clicks: owner can read analytics for their biosites; public (anon) can insert a click event
create policy "clicks_owner_read" on clicks for select
  using (exists (select 1 from biosites b where b.id = clicks.biosite_id and b.owner_id = auth.uid()));
create policy "clicks_public_insert" on clicks for insert
  with check (exists (select 1 from biosites b where b.id = clicks.biosite_id and b.published = true));

-- client_access: only the agency owner manages this table
create policy "client_access_owner_all" on client_access for all
  using (exists (select 1 from biosites b where b.id = client_access.biosite_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from biosites b where b.id = client_access.biosite_id and b.owner_id = auth.uid()));
