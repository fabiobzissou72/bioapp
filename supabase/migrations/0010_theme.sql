alter table biosites add column theme text not null default 'light' check (theme in ('light', 'dark'));
