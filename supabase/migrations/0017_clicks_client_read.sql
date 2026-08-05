create policy "clicks_client_read" on clicks for select
  using (
    exists (
      select 1 from client_access ca
      where ca.biosite_id = clicks.biosite_id
        and ca.email = auth.jwt()->>'email'
    )
  );
