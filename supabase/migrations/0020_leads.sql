-- Instagram prospecting leads captured by the Chrome extension.
create table leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  niche text,
  city text,
  instagram_handle text not null,
  profile_url text,
  full_name text,
  bio_text text,
  has_link_in_bio boolean not null default false,
  is_target boolean,
  ai_reasoning text,
  suggested_approach text,
  status text not null default 'novo' check (status in ('novo', 'contatado', 'respondeu', 'fechado', 'descartado')),
  captured_at timestamptz not null default now(),
  unique (owner_id, instagram_handle)
);
create index leads_owner_id_idx on leads(owner_id);

alter table leads enable row level security;

create policy "leads_owner_all" on leads for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
