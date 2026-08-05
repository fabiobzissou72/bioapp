alter table catalog_groups drop constraint catalog_groups_layout_check;
alter table catalog_groups add constraint catalog_groups_layout_check
  check (layout in ('stacked', 'carousel', 'grid'));
