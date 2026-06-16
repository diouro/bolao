alter table public.matches
add column if not exists external_provider text,
add column if not exists external_match_id text;

create unique index if not exists matches_external_provider_match_id_idx
on public.matches (external_provider, external_match_id)
where external_provider is not null and external_match_id is not null;
