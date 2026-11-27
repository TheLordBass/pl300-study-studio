-- PL-300 Studio: sync across devices.
--
-- Paste this whole file into Supabase -> SQL Editor -> New query, and press Run.
-- Running it again is safe. It lives in the same project as databites, beside
-- (and separate from) databites' own `sync` table: every name here starts with
-- pl300_.
--
-- Progress is kept under a sync code, with no name or email. The code itself
-- isn't stored, only its SHA-256, so even a leaked copy of the tables can't be
-- used to open anyone's progress. The app can't read, list or write the tables
-- directly: it can only call the five functions below, each with a code.
--
-- Versions: every save names the version it was based on and gets the next
-- number. A save based on an old version is refused, so two devices never
-- overwrite each other. The copy each save replaces goes into
-- pl300_sync_history, which keeps the last 15, so a code can be rolled back.

create table if not exists public.pl300_sync (
  id         text primary key,                 -- SHA-256 of the sync code, as hex
  data       jsonb not null,                   -- { schema, app, device, progress }
  version    bigint not null default 1,        -- goes up by one on every save
  updated_at timestamptz not null default now()
);

create table if not exists public.pl300_sync_history (
  id       text not null references public.pl300_sync (id) on delete cascade,
  version  bigint not null,
  data     jsonb not null,
  saved_at timestamptz not null,
  primary key (id, version)
);

-- Row level security on, and no policies: nobody gets at the tables directly.
alter table public.pl300_sync enable row level security;
alter table public.pl300_sync_history enable row level security;
revoke all on table public.pl300_sync from anon, authenticated;
revoke all on table public.pl300_sync_history from anon, authenticated;

-- A code is 20 characters of Crockford base32: 0-9 and A-Z without I, L, O and U.
create or replace function public.pl300_sync_id(code text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if code is null or code !~ '^[0-9A-HJKMNP-TV-Z]{20}$' then
    raise exception 'not a sync code' using errcode = '22023';
  end if;
  return encode(sha256(convert_to(code, 'UTF8')), 'hex');
end;
$$;

-- The latest progress for a code, with its version. No row if there isn't any.
create or replace function public.pl300_sync_load(code text)
returns table (data jsonb, version bigint, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.data, s.version, s.updated_at
  from public.pl300_sync s
  where s.id = public.pl300_sync_id(code);
$$;

-- Saves progress on top of version `base` (0 for a new code) and returns the
-- new version. Returns null, saving nothing, if another device saved first:
-- the app then loads, merges and tries again. Also null if the copy was
-- deleted meanwhile.
create or replace function public.pl300_sync_save(code text, payload jsonb, base bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  sync_key text := public.pl300_sync_id(code);
  stored bigint;
  old_data jsonb;
  old_at timestamptz;
begin
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'progress must be a JSON object' using errcode = '22023';
  end if;
  if octet_length(payload::text) > 200000 then
    raise exception 'progress is too big to sync' using errcode = '22023';
  end if;

  select s.version, s.data, s.updated_at into stored, old_data, old_at
  from public.pl300_sync s where s.id = sync_key for update;

  if not found then
    if coalesce(base, 0) <> 0 then
      return null;                     -- it was deleted on another device
    end if;
    -- A cap, so nobody can fill the free tier with junk codes.
    if (select count(*) from public.pl300_sync) >= 2000 then
      raise exception 'sync is full' using errcode = '53400';
    end if;
    insert into public.pl300_sync (id, data, version) values (sync_key, payload, 1)
      on conflict (id) do nothing;
    if not found then
      return null;                     -- another device made it a moment ago
    end if;
    return 1;
  end if;

  if stored <> base then
    return null;                       -- another device saved first
  end if;

  -- Keep the copy being replaced, and only the last 15 of them.
  insert into public.pl300_sync_history (id, version, data, saved_at)
    values (sync_key, stored, old_data, old_at)
    on conflict (id, version) do nothing;
  delete from public.pl300_sync_history h
    where h.id = sync_key and h.version <= stored - 15;

  update public.pl300_sync s
    set data = payload, version = stored + 1, updated_at = now()
    where s.id = sync_key;
  return stored + 1;
end;
$$;

-- Every version still kept for a code, newest first: the current one and the
-- history. `device` and `app` say where and in which build each was saved.
create or replace function public.pl300_sync_versions(code text)
returns table (version bigint, saved_at timestamptz, device text, app text, bytes integer, current boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with key as (select public.pl300_sync_id(code) as id)
  select v.version, v.saved_at, v.data ->> 'device', v.data ->> 'app',
         octet_length(v.data::text), v.current
  from (
    select s.version, s.updated_at as saved_at, s.data, true as current
      from public.pl300_sync s, key where s.id = key.id
    union all
    select h.version, h.saved_at, h.data, false
      from public.pl300_sync_history h, key where h.id = key.id
  ) v
  order by v.version desc;
$$;

-- One kept version's progress, for rolling back. Null if it isn't kept.
create or replace function public.pl300_sync_load_version(code text, wanted bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with key as (select public.pl300_sync_id(code) as id)
  select coalesce(
    (select s.data from public.pl300_sync s, key where s.id = key.id and s.version = wanted),
    (select h.data from public.pl300_sync_history h, key where h.id = key.id and h.version = wanted)
  );
$$;

-- Erases the copy for a code, and its history. True if there was one.
create or replace function public.pl300_sync_delete(code text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.pl300_sync s where s.id = public.pl300_sync_id(code) returning 1
  )
  select exists (select 1 from gone);
$$;

-- Only these five are callable from the app.
revoke all on function public.pl300_sync_id(text) from public, anon, authenticated;
revoke all on function public.pl300_sync_load(text) from public;
revoke all on function public.pl300_sync_save(text, jsonb, bigint) from public;
revoke all on function public.pl300_sync_versions(text) from public;
revoke all on function public.pl300_sync_load_version(text, bigint) from public;
revoke all on function public.pl300_sync_delete(text) from public;
grant execute on function public.pl300_sync_load(text) to anon, authenticated;
grant execute on function public.pl300_sync_save(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.pl300_sync_versions(text) to anon, authenticated;
grant execute on function public.pl300_sync_load_version(text, bigint) to anon, authenticated;
grant execute on function public.pl300_sync_delete(text) to anon, authenticated;

notify pgrst, 'reload schema';
