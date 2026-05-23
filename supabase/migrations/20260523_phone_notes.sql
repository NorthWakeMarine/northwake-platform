create table if not exists phone_notes (
  id          uuid primary key default gen_random_uuid(),
  phone       text unique not null,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists phone_notes_phone_idx on phone_notes (phone);
