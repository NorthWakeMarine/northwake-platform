alter table contacts add column if not exists openphone_contact_id text default null;
create index if not exists contacts_openphone_contact_id_idx on contacts (openphone_contact_id);
