-- Bio Insta core schema
-- Agency owner profile (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_name text,
  agency_logo_url text,
  agency_link text,
  plan_limit int not null default 30,
  created_at timestamptz not null default now()
);

-- Biosites (one per end customer, owned by an agency profile)
create table biosites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  description text,
  template text default 'default',
  logo_url text,
  logo_shape text default 'round' check (logo_shape in ('round', 'square')),
  cover_type text check (cover_type in ('image', 'video')),
  cover_url text,
  primary_color text default '#ec4899',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index biosites_owner_id_idx on biosites(owner_id);

-- Buttons (instagram, whatsapp, google review, pix, wifi, address, booking, custom)
create table buttons (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  type text not null check (type in ('instagram','whatsapp','google_review','pix','wifi','address','booking','custom')),
  label text,
  url text,
  color text,
  style text default 'full' check (style in ('full', 'icon')),
  pulse boolean not null default false,
  position int not null default 0,
  config jsonb not null default '{}'::jsonb, -- type-specific fields: pix {key,key_type}, wifi {ssid,password}, whatsapp {message}, address {full_address}
  created_at timestamptz not null default now()
);
create index buttons_biosite_id_idx on buttons(biosite_id);

-- Catalog groups (a group is either a stacked block or an auto-rotating carousel)
create table catalog_groups (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  layout text not null default 'stacked' check (layout in ('stacked', 'carousel')),
  interval_seconds int not null default 5,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index catalog_groups_biosite_id_idx on catalog_groups(biosite_id);

-- Catalog items inside a group
create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references catalog_groups(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  media_url text,
  aspect text default 'square' check (aspect in ('square','horizontal','vertical','original')),
  title text,
  description text,
  cta_label text,
  cta_url text,
  cta_align text default 'left' check (cta_align in ('left','center','right')),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index catalog_items_group_id_idx on catalog_items(group_id);

-- Services offered (for the booking system)
create table services (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  name text not null,
  duration_minutes int not null default 60,
  price numeric(10,2),
  created_at timestamptz not null default now()
);
create index services_biosite_id_idx on services(biosite_id);

-- Staff / collaborators
create table staff (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);
create index staff_biosite_id_idx on staff(biosite_id);

create table staff_services (
  staff_id uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- Weekly availability per staff member
create table availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
create index availability_staff_id_idx on availability(staff_id);

-- Bookings made by end customers
create table bookings (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  notes text,
  booking_date date not null,
  booking_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  created_at timestamptz not null default now()
);
create index bookings_biosite_id_idx on bookings(biosite_id);
create index bookings_date_idx on bookings(biosite_id, booking_date);

-- Click analytics
create table clicks (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  button_id uuid references buttons(id) on delete set null,
  device text,
  source text,
  created_at timestamptz not null default now()
);
create index clicks_biosite_id_idx on clicks(biosite_id);

-- Client (end customer) portal access with granular permissions
create table client_access (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references biosites(id) on delete cascade,
  email text not null,
  can_edit_bookings boolean not null default true,
  can_edit_availability boolean not null default true,
  can_edit_editor boolean not null default false,
  created_at timestamptz not null default now()
);
create index client_access_biosite_id_idx on client_access(biosite_id);
create unique index client_access_email_idx on client_access(biosite_id, email);
