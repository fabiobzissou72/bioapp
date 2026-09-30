alter table biosites
  add column show_business_hours boolean not null default false,
  add column business_hours jsonb not null default '[
    {"day":0,"closed":true,"open":"09:00","close":"18:00"},
    {"day":1,"closed":false,"open":"09:00","close":"18:00"},
    {"day":2,"closed":false,"open":"09:00","close":"18:00"},
    {"day":3,"closed":false,"open":"09:00","close":"18:00"},
    {"day":4,"closed":false,"open":"09:00","close":"18:00"},
    {"day":5,"closed":false,"open":"09:00","close":"18:00"},
    {"day":6,"closed":true,"open":"09:00","close":"18:00"}
  ]'::jsonb,
  add column highlight_cards jsonb not null default '[]'::jsonb;
