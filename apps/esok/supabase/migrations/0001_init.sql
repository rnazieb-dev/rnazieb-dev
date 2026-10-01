-- Esok — skema inti, RLS, dan fungsi sisi-server.
--
-- PRINSIP PRIVASI (diuji di __tests__/rls.test.ts):
--  * Amalan rahasia & refleksi HANYA ada di `private_items` (ciphertext E2EE).
--  * Tidak ada fungsi, view, atau trigger yang membaca/menggabungkan `private_items`
--    dengan fitur sosial (feed, peringkat, poin, tantangan, push).
--  * `deeds` hanya menerima visibilitas 'circle' atau 'public' (CHECK) — 'secret' ditolak.
--  * Poin publik hanya dibuat oleh fungsi server (`award_points_for_deed`) dengan batas harian.

-- =====================================================================
-- Profil
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Hamba Allah' check (char_length(display_name) between 1 and 40),
  show_in_rankings boolean not null default true,
  -- "Mode ikhlas": sembunyikan angka publik milik sendiri dari orang lain.
  honor_mode boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- Lingkaran (circle)
-- =====================================================================
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('campur','sesama_jenis','keluarga')),
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  rankings_enabled boolean not null default true,
  comments_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','active')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_members_user on public.circle_members(user_id);

create function public.is_circle_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members m
                 where m.circle_id = cid and m.user_id = auth.uid() and m.status = 'active')
$$;

create function public.is_circle_admin(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members m
                 where m.circle_id = cid and m.user_id = auth.uid() and m.status = 'active' and m.role = 'admin')
$$;

create function public.shares_circle_with(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members a join circle_members b on a.circle_id = b.circle_id
                 where a.user_id = auth.uid() and b.user_id = uid and a.status = 'active' and b.status = 'active')
$$;

-- Blokir
create table public.blocks (
  blocker uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;

-- =====================================================================
-- Amal yang DIBAGIKAN (bukan rahasia)
-- =====================================================================
create table public.deeds (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  title text not null check (char_length(title) between 1 and 120),
  note text not null default '' check (char_length(note) <= 500),
  category text not null check (category in ('ibadah','keluarga','sedekah','ilmu','memaafkan','lingkungan','sosial','diri')),
  visibility text not null check (visibility in ('circle','public')),
  circle_id uuid references public.circles(id) on delete cascade,
  mission_id text,
  shared_id uuid,
  points int not null default 0 check (points between 0 and 30),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  check ((visibility = 'circle' and circle_id is not null) or (visibility = 'public' and circle_id is null))
);
create index deeds_user_synced on public.deeds(user_id, synced_at);
create index deeds_circle on public.deeds(circle_id, day);

-- =====================================================================
-- Item PRIVAT (E2EE): ciphertext saja
-- =====================================================================
create table public.private_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  kind text not null check (kind in ('deed','reflection')),
  ciphertext text not null check (char_length(ciphertext) <= 40000),
  nonce text not null check (char_length(nonce) <= 64),
  rev int not null default 1 check (rev >= 1),
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index private_items_synced on public.private_items(user_id, synced_at);

create table public.key_envelopes (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  envelope jsonb not null,
  updated_at timestamptz not null default now()
);

create function public.touch_synced_at() returns trigger language plpgsql as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;

create trigger deeds_touch before insert or update on public.deeds
for each row execute function public.touch_synced_at();
create trigger private_items_touch before insert or update on public.private_items
for each row execute function public.touch_synced_at();

-- =====================================================================
-- Katalog poin misi (sumber kebenaran poin di server)
-- =====================================================================
create table public.mission_points (
  mission_id text primary key,
  points int not null check (points between 1 and 30),
  cadence text not null,
  can_be_shared boolean not null default false,
  min_people int
);

-- =====================================================================
-- Misi bersama
-- =====================================================================
create table public.shared_missions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  mission_id text not null references public.mission_points(mission_id),
  day date not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  min_people int not null default 2 check (min_people >= 2),
  created_at timestamptz not null default now()
);

create table public.shared_participants (
  shared_id uuid not null references public.shared_missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'joined' check (status in ('joined','done')),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  primary key (shared_id, user_id)
);

-- =====================================================================
-- Poin publik (append-only; hanya fungsi server yang menulis)
-- =====================================================================
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete cascade,
  source text not null check (source in ('deed')),
  ref text not null,
  mission_id text,
  amount int not null check (amount > 0 and amount <= 30),
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, source, ref)
);
create index points_ledger_circle on public.points_ledger(circle_id, day);
-- Satu poin per (pengguna, misi, hari): mencegah dobel via amal ganda atau shared_id dikosongkan.
create unique index points_ledger_once_per_mission_day on public.points_ledger(user_id, mission_id, day)
  where mission_id is not null;
create index points_ledger_user_day on public.points_ledger(user_id, day);

-- =====================================================================
-- Feed, reaksi, komentar
-- =====================================================================
create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deed_id uuid references public.deeds(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 280),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index feed_posts_circle on public.feed_posts(circle_id, created_at desc);

create function public.can_see_post(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from feed_posts p
                 join circle_members m on m.circle_id = p.circle_id
                 where p.id = pid and m.user_id = auth.uid() and m.status = 'active'
                   and (not p.hidden or p.user_id = auth.uid() or m.role = 'admin')
                   and not is_blocked_between(auth.uid(), p.user_id))
$$;

create table public.reactions (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('barakallah','aamiin')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post on public.comments(post_id, created_at);

-- =====================================================================
-- Tantangan lingkaran
-- =====================================================================
create table public.circle_challenges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  target int not null check (target between 1 and 1000000),
  unit text not null default 'amal' check (char_length(unit) between 1 and 20),
  starts_on date not null,
  ends_on date not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on - starts_on <= 366)
);

create table public.challenge_contributions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.circle_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null check (amount between 1 and 100),
  day date not null,
  created_at timestamptz not null default now()
);
create index challenge_contrib on public.challenge_contributions(challenge_id, day);

-- =====================================================================
-- Saling mengingatkan, laporan, push token
-- =====================================================================
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ingat','doa')),
  created_at timestamptz not null default now()
);
create index nudges_to on public.nudges(to_user, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','user','circle')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 300),
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token text not null check (char_length(token) <= 200),
  platform text not null check (platform in ('ios','android')),
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.blocks enable row level security;
alter table public.deeds enable row level security;
alter table public.private_items enable row level security;
alter table public.key_envelopes enable row level security;
alter table public.mission_points enable row level security;
alter table public.shared_missions enable row level security;
alter table public.shared_participants enable row level security;
alter table public.points_ledger enable row level security;
alter table public.feed_posts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.circle_challenges enable row level security;
alter table public.challenge_contributions enable row level security;
alter table public.nudges enable row level security;
alter table public.reports enable row level security;
alter table public.push_tokens enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (shares_circle_with(id) and not is_blocked_between(auth.uid(), id)));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- circles (dibuat lewat create_circle)
create policy circles_select on public.circles for select to authenticated using (is_circle_member(id));
create policy circles_update on public.circles for update to authenticated
  using (is_circle_admin(id)) with check (is_circle_admin(id));
create policy circles_delete on public.circles for delete to authenticated using (is_circle_admin(id));

-- circle_members (bergabung lewat join_circle)
create policy members_select on public.circle_members for select to authenticated
  using (user_id = auth.uid() or is_circle_member(circle_id));
create policy members_update on public.circle_members for update to authenticated
  using (is_circle_admin(circle_id)) with check (is_circle_admin(circle_id));
create policy members_delete on public.circle_members for delete to authenticated
  using (user_id = auth.uid() or is_circle_admin(circle_id));

-- blocks
create policy blocks_all on public.blocks for all to authenticated
  using (blocker = auth.uid()) with check (blocker = auth.uid());

-- deeds
create policy deeds_select on public.deeds for select to authenticated using (
  user_id = auth.uid()
  or (deleted_at is null and not is_blocked_between(auth.uid(), user_id)
      and ((visibility = 'public' and shares_circle_with(user_id))
           or (visibility = 'circle' and is_circle_member(circle_id))))
);
create policy deeds_insert on public.deeds for insert to authenticated with check (
  user_id = auth.uid() and (visibility = 'public' or is_circle_member(circle_id))
);
create policy deeds_update on public.deeds for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (visibility = 'public' or is_circle_member(circle_id)));

-- private_items & key_envelopes: HANYA pemilik
create policy private_items_owner on public.private_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy key_envelopes_owner on public.key_envelopes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- katalog poin: baca saja
create policy mission_points_read on public.mission_points for select to authenticated using (true);

-- shared missions
create policy shared_select on public.shared_missions for select to authenticated using (is_circle_member(circle_id));
create policy shared_part_select on public.shared_participants for select to authenticated using (
  exists (select 1 from shared_missions s where s.id = shared_id and is_circle_member(s.circle_id))
);

-- points_ledger: hanya milik sendiri (peringkat lewat fungsi)
create policy ledger_select on public.points_ledger for select to authenticated using (user_id = auth.uid());

-- feed
create policy posts_select on public.feed_posts for select to authenticated using (
  is_circle_member(circle_id)
  and not is_blocked_between(auth.uid(), user_id)
  and (not hidden or user_id = auth.uid() or is_circle_admin(circle_id))
);
create policy posts_insert on public.feed_posts for insert to authenticated with check (
  user_id = auth.uid() and is_circle_member(circle_id)
  and (deed_id is null or exists (select 1 from deeds d where d.id = deed_id and d.user_id = auth.uid()
                                  and d.visibility = 'circle' and d.circle_id = feed_posts.circle_id and d.deleted_at is null))
  and hidden = false
);
create policy posts_update_admin on public.feed_posts for update to authenticated
  using (is_circle_admin(circle_id)) with check (is_circle_admin(circle_id));
create policy posts_delete on public.feed_posts for delete to authenticated
  using (user_id = auth.uid() or is_circle_admin(circle_id));

create policy reactions_select on public.reactions for select to authenticated using (can_see_post(post_id));
create policy reactions_insert on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and can_see_post(post_id));
create policy reactions_delete on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy comments_select on public.comments for select to authenticated
  using (can_see_post(post_id) and (not hidden or user_id = auth.uid()));
create policy comments_insert on public.comments for insert to authenticated with check (
  user_id = auth.uid() and can_see_post(post_id) and hidden = false
  and exists (select 1 from feed_posts p join circles c on c.id = p.circle_id
              where p.id = post_id and c.comments_enabled)
);
create policy comments_delete on public.comments for delete to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from feed_posts p where p.id = post_id and is_circle_admin(p.circle_id))
);
create policy comments_hide_admin on public.comments for update to authenticated
  using (exists (select 1 from feed_posts p where p.id = post_id and is_circle_admin(p.circle_id)))
  with check (exists (select 1 from feed_posts p where p.id = post_id and is_circle_admin(p.circle_id)));

-- tantangan
create policy challenges_select on public.circle_challenges for select to authenticated using (is_circle_member(circle_id));
create policy challenges_admin on public.circle_challenges for all to authenticated
  using (is_circle_admin(circle_id)) with check (is_circle_admin(circle_id) and created_by = auth.uid());
create policy contrib_select on public.challenge_contributions for select to authenticated using (
  exists (select 1 from circle_challenges c where c.id = challenge_id and is_circle_member(c.circle_id))
);

-- nudges, reports, push tokens
create policy nudges_select on public.nudges for select to authenticated
  using (to_user = auth.uid() or from_user = auth.uid());
create policy reports_insert on public.reports for insert to authenticated with check (reporter = auth.uid());
create policy push_tokens_owner on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Sinkronisasi: upsert LWW (security invoker → RLS berlaku)
-- =====================================================================
create function public.push_deeds(rows jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  for r in select * from jsonb_array_elements(rows) loop
    insert into deeds(id, user_id, day, title, note, category, visibility, circle_id, mission_id, shared_id,
                      points, created_at, updated_at, deleted_at)
    values ((r->>'id')::uuid, auth.uid(), (r->>'day')::date, r->>'title', coalesce(r->>'note',''), r->>'category',
            r->>'visibility', nullif(r->>'circle_id','')::uuid, nullif(r->>'mission_id',''),
            nullif(r->>'shared_id','')::uuid, coalesce((r->>'points')::int, 0),
            (r->>'created_at')::timestamptz, (r->>'updated_at')::timestamptz, (r->>'deleted_at')::timestamptz)
    on conflict (id) do update set
      day = excluded.day, title = excluded.title, note = excluded.note, category = excluded.category,
      visibility = excluded.visibility, circle_id = excluded.circle_id, mission_id = excluded.mission_id,
      shared_id = excluded.shared_id, points = excluded.points, updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
    where deeds.user_id = auth.uid() and deeds.updated_at < excluded.updated_at;
  end loop;
end $$;

create function public.push_private_items(rows jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  for r in select * from jsonb_array_elements(rows) loop
    insert into private_items(user_id, id, kind, ciphertext, nonce, rev, updated_at, deleted_at)
    values (auth.uid(), r->>'id', r->>'kind', r->>'ciphertext', r->>'nonce', (r->>'rev')::int,
            (r->>'updated_at')::timestamptz, (r->>'deleted_at')::timestamptz)
    on conflict (user_id, id) do update set
      kind = excluded.kind, ciphertext = excluded.ciphertext, nonce = excluded.nonce, rev = excluded.rev,
      updated_at = excluded.updated_at, deleted_at = excluded.deleted_at
    -- Seri (rev & hari sama dari dua perangkat) diputus deterministik oleh nonce terbesar;
    -- klien memakai aturan yang sama sehingga semua perangkat konvergen.
    where private_items.rev < excluded.rev
       or (private_items.rev = excluded.rev and private_items.updated_at < excluded.updated_at)
       or (private_items.rev = excluded.rev and private_items.updated_at = excluded.updated_at
           and private_items.nonce < excluded.nonce);
  end loop;
end $$;

-- =====================================================================
-- Poin publik (batas harian + idempoten)
-- =====================================================================
create function public.award_points_for_deed(p_deed_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_deed deeds%rowtype;
  v_pts int;
  v_used int;
  v_allowed int;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  select * into v_deed from deeds where id = p_deed_id and user_id = v_uid and deleted_at is null;
  if not found then raise exception 'deed not found'; end if;
  if exists (select 1 from points_ledger where user_id = v_uid and source = 'deed' and ref = p_deed_id::text) then
    return 0;
  end if;
  -- cegah isi-ulang poin dari hari lampau
  if v_deed.day < current_date - 2 or v_deed.day > current_date + 1 then return 0; end if;
  v_pts := coalesce((select points from mission_points where mission_id = v_deed.mission_id), 3);
  if v_deed.mission_id is not null and exists (
       select 1 from points_ledger where user_id = v_uid and mission_id = v_deed.mission_id and day = v_deed.day) then
    return 0;
  end if;
  if v_deed.shared_id is not null then
    -- Tautan harus konsisten: misi, lingkaran, dan hari sama dengan misi bersama; peserta harus terkonfirmasi.
    if not exists (select 1 from shared_missions sm
                   join shared_participants sp on sp.shared_id = sm.id
                   where sm.id = v_deed.shared_id and sm.mission_id is not distinct from v_deed.mission_id
                     and sm.circle_id is not distinct from v_deed.circle_id and sm.day = v_deed.day
                     and sp.user_id = v_uid and sp.confirmed_by is not null) then
      raise exception 'shared mission not confirmed';
    end if;
  end if;
  select coalesce(sum(amount), 0) into v_used from points_ledger where user_id = v_uid and day = v_deed.day;
  v_allowed := greatest(0, least(v_pts, 100 - v_used));
  if v_allowed = 0 then return 0; end if;
  insert into points_ledger(user_id, circle_id, source, ref, mission_id, amount, day)
  values (v_uid, v_deed.circle_id, 'deed', p_deed_id::text, v_deed.mission_id, v_allowed, v_deed.day);
  return v_allowed;
end $$;

-- =====================================================================
-- Lingkaran: buat, gabung, peringkat, tantangan, nudges, misi bersama
-- =====================================================================
create function public.create_circle(p_name text, p_kind text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_code text; v_n int;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  select count(*) into v_n from circles where created_by = v_uid;
  if v_n >= 10 then raise exception 'terlalu banyak lingkaran'; end if;
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from circles where invite_code = v_code);
  end loop;
  insert into circles(name, kind, invite_code, created_by) values (trim(p_name), p_kind, v_code, v_uid)
  returning id into v_id;
  insert into circle_members(circle_id, user_id, role, status) values (v_id, v_uid, 'admin', 'active');
  return v_id;
end $$;

-- Mengembalikan kode undangan hanya untuk anggota aktif (tidak ada kolom di circles yang bocor ke non-anggota).
create function public.join_circle(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_circle circles%rowtype; v_today int;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  select count(*) into v_today from circle_members where user_id = v_uid and joined_at > now() - interval '1 day';
  if v_today >= 10 then raise exception 'terlalu banyak permintaan bergabung'; end if;
  select * into v_circle from circles where invite_code = upper(trim(p_code));
  if not found then raise exception 'kode tidak valid'; end if;
  if exists (select 1 from blocks b join circle_members m on m.user_id = b.blocker
             where b.blocked = v_uid and m.circle_id = v_circle.id and m.role = 'admin') then
    raise exception 'kode tidak valid';
  end if;
  -- Selalu menunggu persetujuan admin (undangan hanya lewat persetujuan).
  insert into circle_members(circle_id, user_id, role, status) values (v_circle.id, v_uid, 'member', 'pending')
  on conflict do nothing;
  return v_circle.id;
end $$;

create function public.circle_leaderboard(p_circle uuid, p_since date)
returns table(user_id uuid, display_name text, points bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_circle_member(p_circle) then raise exception 'bukan anggota'; end if;
  if not (select rankings_enabled from circles where id = p_circle) then return; end if;
  return query
    select l.user_id, p.display_name, sum(l.amount)::bigint as points
    from points_ledger l join profiles p on p.id = l.user_id
    join circle_members m on m.circle_id = l.circle_id and m.user_id = l.user_id and m.status = 'active'
    where l.circle_id = p_circle and l.day >= p_since and p.show_in_rankings and not p.honor_mode
    group by l.user_id, p.display_name
    order by points desc, p.display_name
    limit 10;
end $$;

create function public.contribute_challenge(p_challenge uuid, p_amount int) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_c circle_challenges%rowtype; v_today int; v_total bigint;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  select * into v_c from circle_challenges where id = p_challenge;
  if not found or not is_circle_member(v_c.circle_id) then raise exception 'tantangan tidak ditemukan'; end if;
  if current_date < v_c.starts_on or current_date > v_c.ends_on then raise exception 'tantangan tidak aktif'; end if;
  if p_amount < 1 or p_amount > 100 then raise exception 'jumlah tidak valid'; end if;
  select coalesce(sum(amount), 0) into v_today from challenge_contributions
   where challenge_id = p_challenge and user_id = v_uid and day = current_date;
  if v_today + p_amount > 100 then raise exception 'batas kontribusi harian tercapai'; end if;
  insert into challenge_contributions(challenge_id, user_id, amount, day) values (p_challenge, v_uid, p_amount, current_date);
  select coalesce(sum(amount), 0) into v_total from challenge_contributions where challenge_id = p_challenge;
  return v_total;
end $$;

create function public.challenge_progress(p_challenge uuid)
returns table(total bigint, contributors bigint, target int)
language plpgsql stable security definer set search_path = public as $$
declare v_c circle_challenges%rowtype;
begin
  select * into v_c from circle_challenges where id = p_challenge;
  if not found or not is_circle_member(v_c.circle_id) then raise exception 'tantangan tidak ditemukan'; end if;
  return query select coalesce(sum(cc.amount), 0)::bigint, count(distinct cc.user_id)::bigint, v_c.target
               from challenge_contributions cc where cc.challenge_id = p_challenge;
end $$;

create function public.send_nudge(p_circle uuid, p_to uuid, p_kind text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_pair int; v_all int; v_id uuid;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if v_uid = p_to then raise exception 'tidak dapat mengirim ke diri sendiri'; end if;
  if not is_circle_member(p_circle) then raise exception 'bukan anggota'; end if;
  if not exists (select 1 from circle_members where circle_id = p_circle and user_id = p_to and status = 'active') then
    raise exception 'penerima bukan anggota';
  end if;
  if is_blocked_between(v_uid, p_to) then raise exception 'tidak dapat mengirim'; end if;
  select count(*) into v_pair from nudges where from_user = v_uid and to_user = p_to and created_at > now() - interval '1 day';
  select count(*) into v_all from nudges where from_user = v_uid and created_at > now() - interval '1 day';
  if v_pair >= 3 or v_all >= 20 then raise exception 'batas pengingat harian tercapai'; end if;
  insert into nudges(circle_id, from_user, to_user, kind) values (p_circle, v_uid, p_to, p_kind) returning id into v_id;
  return v_id;
end $$;

create function public.start_shared_mission(p_circle uuid, p_mission text, p_day date) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m mission_points%rowtype; v_id uuid;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if not is_circle_member(p_circle) then raise exception 'bukan anggota'; end if;
  select * into v_m from mission_points where mission_id = p_mission;
  if not found or not v_m.can_be_shared then raise exception 'misi tidak dapat dikerjakan bersama'; end if;
  insert into shared_missions(circle_id, mission_id, day, created_by, min_people)
  values (p_circle, p_mission, p_day, v_uid, greatest(2, coalesce(v_m.min_people, 2))) returning id into v_id;
  insert into shared_participants(shared_id, user_id) values (v_id, v_uid);
  return v_id;
end $$;

create function public.join_shared_mission(p_shared uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_s shared_missions%rowtype;
begin
  select * into v_s from shared_missions where id = p_shared;
  if not found or not is_circle_member(v_s.circle_id) then raise exception 'misi tidak ditemukan'; end if;
  insert into shared_participants(shared_id, user_id) values (p_shared, auth.uid()) on conflict do nothing;
end $$;

create function public.mark_shared_done(p_shared uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update shared_participants set status = 'done' where shared_id = p_shared and user_id = auth.uid();
  if not found then raise exception 'bukan peserta'; end if;
end $$;

-- Konfirmasi sejawat: peserta LAIN mengonfirmasi bahwa p_user telah menyelesaikan.
create function public.confirm_shared_done(p_shared uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_s shared_missions%rowtype; v_n int;
begin
  if auth.uid() = p_user then raise exception 'tidak dapat mengonfirmasi diri sendiri'; end if;
  select * into v_s from shared_missions where id = p_shared;
  if not found or not is_circle_member(v_s.circle_id) then raise exception 'misi tidak ditemukan'; end if;
  if not exists (select 1 from shared_participants where shared_id = p_shared and user_id = auth.uid()) then
    raise exception 'bukan peserta';
  end if;
  select count(*) into v_n from shared_participants where shared_id = p_shared;
  if v_n < v_s.min_people then raise exception 'peserta belum cukup'; end if;
  update shared_participants set confirmed_by = auth.uid(), confirmed_at = now()
   where shared_id = p_shared and user_id = p_user and status = 'done';
  if not found then raise exception 'peserta belum menandai selesai'; end if;
end $$;

-- Hapus akun: seluruh data terhapus lewat ON DELETE CASCADE.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- =====================================================================
-- Hak akses: anon tidak punya akses; authenticated lewat RLS
-- =====================================================================
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;
grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, update, delete on public.circles to authenticated;
grant select, update, delete on public.circle_members to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update on public.deeds to authenticated;
grant select, insert, update, delete on public.private_items to authenticated;
grant select, insert, update, delete on public.key_envelopes to authenticated;
grant select on public.mission_points to authenticated;
grant select on public.shared_missions, public.shared_participants to authenticated;
grant select on public.points_ledger to authenticated;
grant select, insert, update, delete on public.feed_posts to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.circle_challenges to authenticated;
grant select on public.challenge_contributions to authenticated;
grant select on public.nudges to authenticated;
grant insert on public.reports to authenticated;
grant select, insert, delete on public.push_tokens to authenticated;

grant execute on function
  public.is_circle_member(uuid), public.is_circle_admin(uuid), public.shares_circle_with(uuid),
  public.is_blocked_between(uuid, uuid), public.can_see_post(uuid),
  public.push_deeds(jsonb), public.push_private_items(jsonb),
  public.award_points_for_deed(uuid), public.create_circle(text, text), public.join_circle(text),
  public.circle_leaderboard(uuid, date), public.contribute_challenge(uuid, int),
  public.challenge_progress(uuid), public.send_nudge(uuid, uuid, text),
  public.start_shared_mission(uuid, text, date), public.join_shared_mission(uuid),
  public.mark_shared_done(uuid), public.confirm_shared_done(uuid, uuid), public.delete_my_account()
to authenticated;
