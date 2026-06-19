create table if not exists blocked_numbers (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        not null unique,
  reason     text,
  blocked_at timestamptz not null default now(),
  blocked_by text        not null default 'manual'
);

create index if not exists blocked_numbers_phone_idx on blocked_numbers (phone);
