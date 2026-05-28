-- VibeSync Supabase schema. Run in Supabase SQL editor.
-- Tables use auth.uid() for row-level security; every row is scoped to the
-- owning user via user_id = auth.uid().

create extension if not exists "uuid-ossp";

-- Profile mirror of auth.users (display name, avatar)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Liked tracks (per-user)
create table if not exists public.liked_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  title text,
  artist text,
  album text,
  img text,
  duration int,
  added_at timestamptz default now(),
  primary key (user_id, track_id)
);
create index if not exists liked_tracks_user_idx on public.liked_tracks (user_id, added_at desc);

-- User-created playlists
create table if not exists public.playlists (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Playlist',
  description text default '',
  cover_url text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists playlists_owner_idx on public.playlists (owner_id, updated_at desc);

-- Playlist tracks (ordered by position)
create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  position int not null,
  track_id text not null,
  title text,
  artist text,
  album text,
  img text,
  duration int,
  added_at timestamptz default now(),
  primary key (playlist_id, position)
);
create index if not exists pl_tracks_pl_idx on public.playlist_tracks (playlist_id, position);

-- Follows: artist or user (spotify_id / supabase uid)
create table if not exists public.follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                       -- 'artist' | 'user' | 'playlist'
  target_id text not null,
  added_at timestamptz default now(),
  primary key (user_id, kind, target_id)
);
create index if not exists follows_user_idx on public.follows (user_id, kind);

-- Listening history (recently played)
create table if not exists public.history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  title text,
  artist text,
  img text,
  played_at timestamptz default now()
);
create index if not exists history_user_idx on public.history (user_id, played_at desc);

-- Row-Level Security
alter table public.profiles        enable row level security;
alter table public.liked_tracks    enable row level security;
alter table public.playlists       enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.follows         enable row level security;
alter table public.history         enable row level security;

-- Profiles: anyone authenticated can read, only owner can write
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles write own" on public.profiles;
create policy "profiles write own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Liked tracks: only owner
drop policy if exists "liked own" on public.liked_tracks;
create policy "liked own" on public.liked_tracks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Playlists: read if owner OR public; write only owner
drop policy if exists "pl read" on public.playlists;
create policy "pl read" on public.playlists for select using (is_public or owner_id = auth.uid());
drop policy if exists "pl write own" on public.playlists;
create policy "pl write own" on public.playlists for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Playlist tracks: read if parent playlist is public or owned; write only if owned
drop policy if exists "pl_tracks read" on public.playlist_tracks;
create policy "pl_tracks read" on public.playlist_tracks for select using (
  exists (select 1 from public.playlists p where p.id = playlist_id and (p.is_public or p.owner_id = auth.uid()))
);
drop policy if exists "pl_tracks write" on public.playlist_tracks;
create policy "pl_tracks write" on public.playlist_tracks for all using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid())
);

-- Follows: only owner
drop policy if exists "follows own" on public.follows;
create policy "follows own" on public.follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- History: only owner
drop policy if exists "history own" on public.history;
create policy "history own" on public.history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
