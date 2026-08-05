-- Lets a client_access-linked user read (but not modify) bookings and
-- services for the biosite they were granted access to. Matched by the
-- authenticated user's email against client_access.email — no extra
-- user_id column needed since client_access already stores the email.
create policy "bookings_client_read" on bookings for select
  using (
    exists (
      select 1 from client_access ca
      where ca.biosite_id = bookings.biosite_id
        and ca.email = auth.jwt()->>'email'
    )
  );

create policy "services_client_read" on services for select
  using (
    exists (
      select 1 from client_access ca
      where ca.biosite_id = services.biosite_id
        and ca.email = auth.jwt()->>'email'
    )
  );

create policy "staff_client_read" on staff for select
  using (
    exists (
      select 1 from client_access ca
      where ca.biosite_id = staff.biosite_id
        and ca.email = auth.jwt()->>'email'
    )
  );

-- The client also needs to read their own client_access row(s) to know
-- which biosite(s) they have access to.
create policy "client_access_self_read" on client_access for select
  using (email = auth.jwt()->>'email');
