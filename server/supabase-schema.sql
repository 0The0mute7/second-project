create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    name text not null,
    email text not null unique,
    password_hash text not null,
    profile_picture text,
    bio text not null default '',
    friends text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.activities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    username text not null,
    sport text not null check (sport in ('running', 'cycling', 'swimming', 'walking', 'hiking')),
    distance numeric not null,
    duration text not null,
    pace text not null,
    speed numeric not null,
    date text not null,
    time text not null,
    notes text not null default '',
    calories integer not null default 0,
    likes text[] not null default '{}',
    comments jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    from_username text not null,
    to_username text not null,
    text text not null,
    read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_users_username on public.users(username);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_activities_user_id_created_at on public.activities(user_id, created_at desc);
create index if not exists idx_activities_username_created_at on public.activities(username, created_at desc);
create index if not exists idx_messages_pair_created_at on public.messages(from_username, to_username, created_at desc);
create index if not exists idx_messages_to_username_read on public.messages(to_username, read);
