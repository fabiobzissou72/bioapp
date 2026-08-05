-- Auto-create a profile row when a new auth user is created, so it exists
-- regardless of whether email confirmation happens before or after signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, agency_name)
  values (new.id, new.raw_user_meta_data->>'agency_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
