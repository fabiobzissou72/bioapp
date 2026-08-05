-- A client_access account is a read-only viewer, never an agency. Block
-- it from creating biosites at the database level too (not just hiding
-- the UI), in case someone hits the API directly. Restrictive policies
-- AND with every permissive policy, so this narrows biosites_owner_all's
-- insert allowance regardless of what else is true.
create policy "biosites_block_client_insert" on biosites as restrictive for insert
  with check (
    not exists (select 1 from client_access ca where ca.email = auth.jwt()->>'email')
  );
