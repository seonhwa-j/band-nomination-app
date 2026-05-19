create type song_status as enum ('PENDING', 'ACTIVE');
create type vote_type as enum ('LIKES', 'AGREE', 'MEH', 'THINK', 'CANNOT', 'NONE');

create table public.users (
  id text primary key,
  username text not null,
  role text not null,
  profile_picture text
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  youtube_link text,
  added_by text references public.users(id),
  status song_status not null default 'PENDING',
  note text,
  created_at timestamptz not null default now()
);

create table public.song_role_votes (
  song_id uuid not null references public.songs(id) on delete cascade,
  member_id text not null references public.users(id),
  role_key text not null,
  vote_type vote_type not null default 'NONE',
  updated_at timestamptz not null default now(),
  primary key (song_id, member_id, role_key)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id text not null references public.users(id),
  user_part text not null default '',
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter publication supabase_realtime add table public.songs;
alter publication supabase_realtime add table public.song_role_votes;
alter publication supabase_realtime add table public.comments;
