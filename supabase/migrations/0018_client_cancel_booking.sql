-- Lets a client_access user cancel a booking for their biosite (frees the
-- slot back up, since the booking flow already excludes cancelled rows
-- from occupied time blocks). Restricted to only flipping status to
-- 'cancelled' — can't rewrite other fields via this policy.
create policy "bookings_client_cancel" on bookings for update
  using (
    exists (
      select 1 from client_access ca
      where ca.biosite_id = bookings.biosite_id
        and ca.email = auth.jwt()->>'email'
    )
  )
  with check (status = 'cancelled');
