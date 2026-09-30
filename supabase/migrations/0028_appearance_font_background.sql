alter table biosites
  add column logo_size text not null default 'medium' check (logo_size in ('small', 'medium', 'large')),
  add column font_family text not null default 'default' check (
    font_family in ('default', 'poppins', 'playfair', 'bebas', 'caveat', 'oswald', 'merriweather')
  ),
  add column background_image_url text,
  add column background_darken boolean not null default true;
