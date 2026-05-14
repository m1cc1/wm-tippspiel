-- ============================================================
-- WM 2026 Tippspiel – Supabase SQL Setup v2
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  total_points    integer not null default 0,
  exact_count     integer not null default 0,
  tendency_count  integer not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending', 'active')),
  invite_code     text,
  created_at      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ── 2. GAMES ────────────────────────────────────────────────
create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  home_team    text not null,
  away_team    text not null,
  home_flag    text default '',
  away_flag    text default '',
  kickoff      timestamptz not null,
  group_stage  text not null default 'Group Stage',
  venue        text default '',
  status       text not null default 'scheduled'
                 check (status in ('scheduled','live','finished')),
  home_score   integer,
  away_score   integer,
  minute       integer,
  external_id  integer unique,
  created_at   timestamptz default now()
);

alter table public.games enable row level security;

create policy "Anyone can read games"
  on public.games for select using (true);

create policy "Service role can do everything on games"
  on public.games for all using (auth.role() = 'service_role');

-- ── 3. TIPS ─────────────────────────────────────────────────
create table if not exists public.tips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  game_id     uuid not null references public.games(id) on delete cascade,
  tip_home    integer not null check (tip_home >= 0),
  tip_away    integer not null check (tip_away >= 0),
  points      integer check (points in (0, 1, 3)),
  created_at  timestamptz default now(),
  unique (user_id, game_id)
);

alter table public.tips enable row level security;

create policy "Active users can read their own tips"
  on public.tips for select using (auth.uid() = user_id);

create policy "Active users can insert tips"
  on public.tips for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
    and exists (
      select 1 from public.games
      where id = game_id and status = 'scheduled'
    )
  );

create policy "Active users can update their own tips"
  on public.tips for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
    and exists (
      select 1 from public.games
      where id = game_id and status = 'scheduled'
    )
  );

-- ── 4. SPECIAL PICKS ────────────────────────────────────────
create table if not exists public.special_picks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade unique,
  tournament_winner text,
  top_scorer_nation text,
  locked          boolean not null default false,
  created_at      timestamptz default now()
);

alter table public.special_picks enable row level security;

create policy "Users can read all special picks"
  on public.special_picks for select using (true);

create policy "Active users can upsert their own special picks"
  on public.special_picks for all using (auth.uid() = user_id);

-- ── 5. SETTINGS (invite code, etc.) ─────────────────────────
create table if not exists public.settings (
  key   text primary key,
  value text not null
);

-- Insert invite code (change MICCI2026 to whatever you want)
insert into public.settings (key, value)
values ('invite_code', 'MICCI2026')
on conflict (key) do nothing;

-- Entry fee in CHF
insert into public.settings (key, value)
values ('entry_fee_chf', '20')
on conflict (key) do nothing;

alter table public.settings enable row level security;

create policy "Anyone can read settings"
  on public.settings for select using (true);

-- ── 6. FUNCTION: refresh profile points ─────────────────────
create or replace function public.refresh_profile_points()
returns void language plpgsql security definer as $$
begin
  update public.profiles p
  set
    total_points   = coalesce(agg.total, 0),
    exact_count    = coalesce(agg.exact, 0),
    tendency_count = coalesce(agg.tend,  0)
  from (
    select
      user_id,
      sum(points)                             as total,
      count(*) filter (where points = 3)      as exact,
      count(*) filter (where points = 1)      as tend
    from public.tips
    where points is not null
    group by user_id
  ) agg
  where p.id = agg.user_id;
end;
$$;

-- ── 7. FUNCTION: leaderboard with live delta + prize ─────────
create or replace function public.get_leaderboard()
returns table (
  id              uuid,
  display_name    text,
  status          text,
  total_points    integer,
  exact_count     integer,
  tendency_count  integer,
  rank            bigint,
  delta           integer
) language plpgsql security definer as $$
begin
  return query
  with live_delta as (
    select
      t.user_id,
      sum(
        case
          when t.tip_home = g.home_score and t.tip_away = g.away_score then 10
          when (t.tip_home - t.tip_away) = (g.home_score - g.away_score) then 8
          when (
            case when t.tip_home > t.tip_away then 'home'
                 when t.tip_home < t.tip_away then 'away'
                 else 'draw' end
          ) = (
            case when g.home_score > g.away_score then 'home'
                 when g.home_score < g.away_score then 'away'
                 else 'draw' end
          ) then 5
          else 0
        end
      )::integer as delta_pts
    from public.tips t
    join public.games g on g.id = t.game_id
    where g.status = 'live' and g.home_score is not null
    group by t.user_id
  )
  select
    p.id,
    p.display_name,
    p.status,
    p.total_points,
    p.exact_count,
    p.tendency_count,
    -- pending users always rank last, active users ranked by points
    rank() over (
      order by
        case when p.status = 'active' then 0 else 1 end,
        (p.total_points + coalesce(ld.delta_pts, 0)) desc
    ),
    coalesce(ld.delta_pts, 0)::integer
  from public.profiles p
  left join live_delta ld on ld.user_id = p.id
  order by
    case when p.status = 'active' then 0 else 1 end,
    (p.total_points + coalesce(ld.delta_pts, 0)) desc;
end;
$$;

-- ── 8. REALTIME ──────────────────────────────────────────────
alter publication supabase_realtime add table public.tips;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.profiles;

-- ── ADMIN: allow active users to update any profile status ──────────────
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admin can update any profile status" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admin can update any profile status"
  on public.profiles for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
  );
