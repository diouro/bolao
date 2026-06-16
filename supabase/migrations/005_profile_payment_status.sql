alter table public.profiles
add column if not exists has_paid boolean not null default false;
