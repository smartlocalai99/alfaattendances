-- Teacher records may be created before their details are available.
alter table public.teachers
  alter column employee_id drop not null;
