alter table catalog_items add column item_type text not null default 'product'
  check (item_type in ('product', 'service'));
