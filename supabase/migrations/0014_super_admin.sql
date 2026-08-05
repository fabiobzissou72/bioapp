alter table profiles add column is_super_admin boolean not null default false;
alter table biosites add column payment_status text not null default 'pendente'
  check (payment_status in ('pago', 'pendente', 'atrasado'));
alter table biosites add column admin_notes text;

-- Super admins can see and manage every biosite/profile across all agencies.
create policy "biosites_super_admin_all" on biosites for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true));

create policy "profiles_super_admin_read" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true));
