create table if not exists linked_contacts (
  id                   uuid primary key default gen_random_uuid(),
  primary_contact_id   uuid not null references contacts(id) on delete cascade,
  name                 text not null,
  phone                text,
  email                text,
  relationship         text default 'associate',
  authorized_to_approve boolean default false,
  created_at           timestamptz default now()
);

create index if not exists linked_contacts_primary_contact_id_idx on linked_contacts(primary_contact_id);
create index if not exists linked_contacts_phone_idx on linked_contacts(phone);
