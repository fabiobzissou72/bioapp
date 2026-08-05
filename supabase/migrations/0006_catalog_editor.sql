-- Catalog groups get a user-facing name and an enable/disable toggle.
alter table catalog_groups add column name text not null default 'Catálogo';
alter table catalog_groups add column enabled boolean not null default true;

-- Catalog items get an object-fit control independent of the aspect ratio
-- (aspect = container shape, fit = crop-to-fill vs. letterbox-to-fit).
alter table catalog_items add column object_fit text not null default 'cover' check (object_fit in ('cover', 'contain'));
