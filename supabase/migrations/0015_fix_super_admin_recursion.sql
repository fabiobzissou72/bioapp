-- The super-admin policies queried `profiles` from within a policy ON
-- `profiles` itself (directly or via the biosites policy's subquery),
-- causing "infinite recursion detected in policy for relation profiles"
-- and breaking ALL reads on profiles/biosites for every user, not just
-- admins. Fix: check the flag through a SECURITY DEFINER function, which
-- runs as its owner and bypasses RLS internally, breaking the recursion.
drop policy if exists "biosites_super_admin_all" on biosites;
drop policy if exists "profiles_super_admin_read" on profiles;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_super_admin from profiles p where p.id = auth.uid()), false);
$$;

create policy "biosites_super_admin_all" on biosites for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "profiles_super_admin_read" on profiles for select
  using (public.is_super_admin());
