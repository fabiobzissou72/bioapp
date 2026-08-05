-- Public bucket for biosite media (logos, covers, catalog images/videos)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media_owner_insert" on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "media_owner_update" on storage.objects for update
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "media_owner_delete" on storage.objects for delete
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
