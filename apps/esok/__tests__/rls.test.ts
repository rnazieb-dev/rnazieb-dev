import { randomUUID } from 'node:crypto';
import type { PGlite } from '@electric-sql/pglite';
import { asUser, expectDenied, makePg, newUser } from './helpers/pg';

let db: PGlite;
jest.setTimeout(60000);

beforeAll(async () => {
  db = await makePg();
});
afterAll(async () => {
  await db.close();
});

const today = () => new Date().toISOString().slice(0, 10);

const deedRow = (over: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  day: today(),
  title: 'berbagi takjil',
  note: '',
  category: 'sedekah',
  visibility: 'public',
  circle_id: null,
  mission_id: null,
  shared_id: null,
  points: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...over,
});

async function circleWith(admin: string, members: string[] = [], kind = 'campur'): Promise<string> {
  const id = (await asUser(db, admin, (q) => q<{ id: string }>('select public.create_circle($1,$2) as id', ['Keluarga', kind])))[0]!.id;
  for (const m of members) {
    await asUser(db, m, (q) => q('select public.join_circle((select invite_code from (select $1::text as invite_code) x))', ['x']).catch(() => []));
    const code = (await db.query<{ invite_code: string }>('select invite_code from public.circles where id = $1', [id])).rows[0]!.invite_code;
    await asUser(db, m, (q) => q('select public.join_circle($1)', [code]));
    await asUser(db, admin, (q) => q(`update public.circle_members set status='active' where circle_id=$1 and user_id=$2`, [id, m]));
  }
  return id;
}

describe('private_items (E2EE): hanya pemilik', () => {
  it('pengguna lain — bahkan sesama anggota lingkaran — tidak dapat membaca/menulis', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    await circleWith(a, [b]);
    await asUser(db, a, (q) =>
      q(`select public.push_private_items($1::jsonb)`, [
        JSON.stringify([{ id: 'x1', kind: 'deed', ciphertext: 'CT', nonce: 'N', rev: 1, updated_at: new Date().toISOString(), deleted_at: null }]),
      ]),
    );
    expect(await asUser(db, a, (q) => q('select id from public.private_items'))).toHaveLength(1);
    expect(await asUser(db, b, (q) => q('select id from public.private_items'))).toHaveLength(0);
    // b mencoba menimpa/menyisipkan sebagai a
    await expectDenied(asUser(db, b, (q) => q(`insert into public.private_items(user_id,id,kind,ciphertext,nonce,updated_at) values ($1,'y','deed','c','n',now())`, [a])));
    expect(await asUser(db, b, (q) => q(`update public.private_items set ciphertext='HACK' where id='x1' returning id`))).toHaveLength(0);
    expect((await db.query<{ ciphertext: string }>(`select ciphertext from public.private_items where id='x1'`)).rows[0]!.ciphertext).toBe('CT');
  });

  it('anon tidak punya akses sama sekali', async () => {
    await expectDenied(asUser(db, null, (q) => q('select * from public.private_items')));
    await expectDenied(asUser(db, null, (q) => q('select * from public.deeds')));
  });

  it('tidak ada fungsi, view, atau trigger sosial yang menyentuh private_items', async () => {
    const funcs = (await db.query<{ proname: string }>(
      `select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and prosrc ilike '%private_items%'`,
    )).rows.map((r) => r.proname).sort();
    // Hanya fungsi sinkron milik-sendiri yang boleh menyebutnya.
    expect(funcs).toEqual(['push_private_items']);
    const views = (await db.query(`select 1 from pg_views where schemaname='public' and definition ilike '%private_items%'`)).rows;
    expect(views).toHaveLength(0);
    const trig = (await db.query<{ tgname: string }>(
      `select tgname from pg_trigger t where tgrelid = 'public.private_items'::regclass and not tgisinternal`,
    )).rows.map((r) => r.tgname);
    expect(trig).toEqual(['private_items_touch']);
    // Tidak ada tabel sosial dengan FK ke private_items.
    const fks = (await db.query(`select 1 from pg_constraint where contype='f' and confrelid = 'public.private_items'::regclass`)).rows;
    expect(fks).toHaveLength(0);
  });

  it('push_private_items: LWW dengan rev', async () => {
    const a = await newUser(db);
    const row = (rev: number, ct: string) => JSON.stringify([{ id: 'r1', kind: 'reflection', ciphertext: ct, nonce: 'n', rev, updated_at: new Date().toISOString(), deleted_at: null }]);
    await asUser(db, a, (q) => q('select public.push_private_items($1::jsonb)', [row(2, 'v2')]));
    await asUser(db, a, (q) => q('select public.push_private_items($1::jsonb)', [row(1, 'stale')]));
    const r = await asUser(db, a, (q) => q<{ ciphertext: string; rev: number }>('select ciphertext, rev from public.private_items'));
    expect(r[0]).toEqual({ ciphertext: 'v2', rev: 2 });
  });

  it('key_envelopes hanya milik sendiri', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    await asUser(db, a, (q) => q(`insert into public.key_envelopes(envelope) values ('{"v":1}')`));
    expect(await asUser(db, b, (q) => q('select * from public.key_envelopes'))).toHaveLength(0);
    expect(await asUser(db, a, (q) => q('select * from public.key_envelopes'))).toHaveLength(1);
  });
});

describe('deeds: tidak pernah menerima rahasia', () => {
  it("visibilitas 'secret' ditolak oleh CHECK", async () => {
    const a = await newUser(db);
    await expectDenied(asUser(db, a, (q) => q(`select public.push_deeds($1::jsonb)`, [JSON.stringify([deedRow({ visibility: 'secret' })])])));
  });

  it('amal lingkaran hanya terlihat anggota aktif; non-anggota & pending tidak', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const outsider = await newUser(db);
    const pending = await newUser(db);
    const cid = await circleWith(a, [b]);
    const code = (await db.query<{ invite_code: string }>('select invite_code from public.circles where id=$1', [cid])).rows[0]!.invite_code;
    await asUser(db, pending, (q) => q('select public.join_circle($1)', [code]));
    const d = deedRow({ visibility: 'circle', circle_id: cid });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
    expect(await asUser(db, b, (q) => q('select id from public.deeds where id=$1', [d.id]))).toHaveLength(1);
    expect(await asUser(db, outsider, (q) => q('select id from public.deeds where id=$1', [d.id]))).toHaveLength(0);
    expect(await asUser(db, pending, (q) => q('select id from public.deeds where id=$1', [d.id]))).toHaveLength(0);
  });

  it('tidak dapat membagikan ke lingkaran yang bukan miliknya', async () => {
    const a = await newUser(db);
    const x = await newUser(db);
    const cid = await circleWith(a);
    await expectDenied(asUser(db, x, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([deedRow({ visibility: 'circle', circle_id: cid })])])));
  });

  it('push_deeds LWW & tidak dapat menimpa milik orang lain', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const d = deedRow({ title: 'v1', updated_at: '2026-10-01T10:00:00Z' });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([{ ...d, title: 'lama', updated_at: '2026-10-01T09:00:00Z' }])]));
    expect((await asUser(db, a, (q) => q<{ title: string }>('select title from public.deeds where id=$1', [d.id])))[0]!.title).toBe('v1');
    // b mencoba menimpa baris milik a dengan id yang sama: diabaikan (tidak ada efek).
    await asUser(db, b, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([{ ...d, title: 'curian', updated_at: '2026-10-02T09:00:00Z' }])]));
    expect((await db.query<{ title: string; user_id: string }>('select title, user_id from public.deeds where id=$1', [d.id])).rows[0]).toEqual({ title: 'v1', user_id: a });
  });
});

describe('poin publik', () => {
  it('idempoten, memakai katalog server, batas harian 100', async () => {
    const a = await newUser(db);
    const ids: string[] = [];
    await asUser(db, a, async (q) => {
      for (let i = 0; i < 6; i++) {
        const d = deedRow({ mission_id: 'bayar-utang-kecil', points: 30 });
        ids.push(d.id);
        await q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]);
      }
    });
    const pts = (await db.query<{ points: number }>(`select points from public.mission_points where mission_id='bayar-utang-kecil'`)).rows[0]?.points;
    expect(pts).toBeGreaterThan(0);
    const first = await asUser(db, a, (q) => q<{ p: number }>('select public.award_points_for_deed($1) as p', [ids[0]]));
    expect(first[0]!.p).toBe(pts);
    const again = await asUser(db, a, (q) => q<{ p: number }>('select public.award_points_for_deed($1) as p', [ids[0]]));
    expect(again[0]!.p).toBe(0);
    let total = pts!;
    for (const id of ids.slice(1)) total += (await asUser(db, a, (q) => q<{ p: number }>('select public.award_points_for_deed($1) as p', [id])))[0]!.p;
    expect(total).toBeLessThanOrEqual(100);
    const sum = (await asUser(db, a, (q) => q<{ s: string }>('select sum(amount)::text s from public.points_ledger')))[0]!.s;
    expect(Number(sum)).toBe(total);
  });

  it('klien tidak dapat menulis ledger langsung', async () => {
    const a = await newUser(db);
    await expectDenied(asUser(db, a, (q) => q(`insert into public.points_ledger(user_id,source,ref,amount,day) values ($1,'deed','z',30,current_date)`, [a])));
  });

  it('tidak dapat mengklaim poin dari hari lampau atau amal orang lain', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const old = deedRow({ day: '2020-01-01' });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([old])]));
    expect((await asUser(db, a, (q) => q<{ p: number }>('select public.award_points_for_deed($1) as p', [old.id])))[0]!.p).toBe(0);
    const mine = deedRow();
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([mine])]));
    await expectDenied(asUser(db, b, (q) => q('select public.award_points_for_deed($1)', [mine.id])));
  });

  it('misi bersama: poin hanya setelah konfirmasi peserta lain', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const cid = await circleWith(a, [b]);
    const mid = (await db.query<{ mission_id: string }>(`select mission_id from public.mission_points where can_be_shared limit 1`)).rows[0]!.mission_id;
    const sid = (await asUser(db, a, (q) => q<{ id: string }>('select public.start_shared_mission($1,$2,current_date) as id', [cid, mid])))[0]!.id;
    await asUser(db, b, (q) => q('select public.join_shared_mission($1)', [sid]));
    const d = deedRow({ visibility: 'circle', circle_id: cid, mission_id: mid, shared_id: sid });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
    await expectDenied(asUser(db, a, (q) => q('select public.award_points_for_deed($1)', [d.id])));
    await asUser(db, a, (q) => q('select public.mark_shared_done($1)', [sid]));
    await expectDenied(asUser(db, a, (q) => q('select public.confirm_shared_done($1,$2)', [sid, a])));
    await asUser(db, b, (q) => q('select public.confirm_shared_done($1,$2)', [sid, a]));
    expect((await asUser(db, a, (q) => q<{ p: number }>('select public.award_points_for_deed($1) as p', [d.id])))[0]!.p).toBeGreaterThan(0);
  });
});

describe('lingkaran & peringkat', () => {
  it('bergabung selalu menunggu persetujuan; kode salah ditolak', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const cid = await circleWith(a);
    const code = (await db.query<{ invite_code: string }>('select invite_code from public.circles where id=$1', [cid])).rows[0]!.invite_code;
    await asUser(db, b, (q) => q('select public.join_circle($1)', [code]));
    const st = (await db.query<{ status: string }>('select status from public.circle_members where circle_id=$1 and user_id=$2', [cid, b])).rows[0]!.status;
    expect(st).toBe('pending');
    await expectDenied(asUser(db, b, (q) => q('select public.join_circle($1)', ['SALAHKODE0'])));
    // pending tidak dapat melihat lingkaran / peringkat
    expect(await asUser(db, b, (q) => q('select * from public.circles where id=$1', [cid]))).toHaveLength(0);
    await expectDenied(asUser(db, b, (q) => q('select * from public.circle_leaderboard($1, current_date - 7)', [cid])));
    // anggota biasa tidak dapat menyetujui dirinya
    expect(await asUser(db, b, (q) => q(`update public.circle_members set status='active' where circle_id=$1 and user_id=$2 returning 1`, [cid, b]))).toHaveLength(0);
  });

  it('peringkat: top 10, hormati show_in_rankings / mode ikhlas / rankings_enabled; hanya poin publik', async () => {
    const admin = await newUser(db, 'Admin');
    const u1 = await newUser(db, 'Satu');
    const u2 = await newUser(db, 'Dua');
    const u3 = await newUser(db, 'Tiga');
    const cid = await circleWith(admin, [u1, u2, u3]);
    const award = async (u: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const d = deedRow({ visibility: 'circle', circle_id: cid, mission_id: 'bayar-utang-kecil' });
        await asUser(db, u, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
        await asUser(db, u, (q) => q('select public.award_points_for_deed($1)', [d.id]));
      }
    };
    await award(u1, 3);
    await award(u2, 1);
    await award(u3, 2);
    // item rahasia tidak punya jalur masuk ke peringkat
    await asUser(db, u2, (q) => q(`select public.push_private_items($1::jsonb)`, [JSON.stringify([{ id: 'z', kind: 'deed', ciphertext: 'c', nonce: 'n', rev: 1, updated_at: new Date().toISOString(), deleted_at: null }])]));
    const rank = await asUser(db, admin, (q) => q<{ display_name: string }>('select * from public.circle_leaderboard($1, current_date - 7)', [cid]));
    expect(rank.map((r) => r.display_name)).toEqual(['Satu', 'Tiga', 'Dua']);
    await asUser(db, u1, (q) => q(`update public.profiles set honor_mode = true where id = $1`, [u1]));
    await asUser(db, u3, (q) => q(`update public.profiles set show_in_rankings = false where id = $1`, [u3]));
    const rank2 = await asUser(db, admin, (q) => q<{ display_name: string }>('select * from public.circle_leaderboard($1, current_date - 7)', [cid]));
    expect(rank2.map((r) => r.display_name)).toEqual(['Dua']);
    await asUser(db, admin, (q) => q('update public.circles set rankings_enabled = false where id = $1', [cid]));
    expect(await asUser(db, admin, (q) => q('select * from public.circle_leaderboard($1, current_date - 7)', [cid]))).toHaveLength(0);
  });

  it('batas 10 teratas (tanpa "juru kunci")', async () => {
    const admin = await newUser(db);
    const cid = await circleWith(admin);
    for (let i = 0; i < 12; i++) {
      const u = await newUser(db, `U${i}`);
      const code = (await db.query<{ invite_code: string }>('select invite_code from public.circles where id=$1', [cid])).rows[0]!.invite_code;
      await asUser(db, u, (q) => q('select public.join_circle($1)', [code]));
      await db.query(`update public.circle_members set status='active' where circle_id=$1 and user_id=$2`, [cid, u]);
      await db.query(`insert into public.points_ledger(user_id,circle_id,source,ref,amount,day) values ($1,$2,'deed',$3,5,current_date)`, [u, cid, `r${i}`]);
    }
    expect(await asUser(db, admin, (q) => q('select * from public.circle_leaderboard($1, current_date)', [cid]))).toHaveLength(10);
  });
});

describe('feed, komentar, moderasi', () => {
  it('feed hanya untuk anggota; posting amal harus amal-lingkaran milik sendiri', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const x = await newUser(db);
    const cid = await circleWith(a, [b]);
    const d = deedRow({ visibility: 'circle', circle_id: cid });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
    const post = (await asUser(db, a, (q) => q<{ id: string }>('insert into public.feed_posts(circle_id, deed_id, body) values ($1,$2,$3) returning id', [cid, d.id, 'Alhamdulillah'])))[0]!.id;
    expect(await asUser(db, b, (q) => q('select * from public.feed_posts where id=$1', [post]))).toHaveLength(1);
    expect(await asUser(db, x, (q) => q('select * from public.feed_posts where id=$1', [post]))).toHaveLength(0);
    await expectDenied(asUser(db, x, (q) => q('insert into public.feed_posts(circle_id, body) values ($1,$2)', [cid, 'masuk'])));
    // mengacu ke amal publik (bukan lingkaran) ditolak
    const pub = deedRow({ visibility: 'public' });
    await asUser(db, a, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([pub])]));
    await expectDenied(asUser(db, a, (q) => q('insert into public.feed_posts(circle_id, deed_id) values ($1,$2)', [cid, pub.id])));
    // reaksi & komentar
    await asUser(db, b, (q) => q(`insert into public.reactions(post_id, kind) values ($1,'barakallah')`, [post]));
    await asUser(db, b, (q) => q(`insert into public.comments(post_id, body) values ($1,'Aamiin')`, [post]));
    await expectDenied(asUser(db, x, (q) => q(`insert into public.reactions(post_id, kind) values ($1,'aamiin')`, [post])));
    await expectDenied(asUser(db, x, (q) => q(`insert into public.comments(post_id, body) values ($1,'hai')`, [post])));
  });

  it('admin dapat menutup komentar & menyembunyikan postingan; blokir menyembunyikan konten', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const cid = await circleWith(a, [b]);
    const post = (await asUser(db, b, (q) => q<{ id: string }>('insert into public.feed_posts(circle_id, body) values ($1,$2) returning id', [cid, 'halo'])))[0]!.id;
    await asUser(db, a, (q) => q('update public.circles set comments_enabled = false where id=$1', [cid]));
    await expectDenied(asUser(db, a, (q) => q(`insert into public.comments(post_id, body) values ($1,'x')`, [post])));
    await asUser(db, a, (q) => q('update public.feed_posts set hidden = true where id=$1', [post]));
    expect(await asUser(db, b, (q) => q('select * from public.feed_posts where id=$1', [post]))).toHaveLength(1); // penulis tetap melihat
    await asUser(db, a, (q) => q('update public.feed_posts set hidden = false where id=$1', [post]));
    const postA = (await asUser(db, a, (q) => q<{ id: string }>('insert into public.feed_posts(circle_id, body) values ($1,$2) returning id', [cid, 'dari a'])))[0]!.id;
    await asUser(db, a, (q) => q('insert into public.blocks(blocked) values ($1)', [b]));
    // a tidak lagi melihat konten b, dan b tidak lagi melihat konten a (dua arah)
    expect(await asUser(db, a, (q) => q('select * from public.feed_posts where id=$1', [post]))).toHaveLength(0);
    expect(await asUser(db, b, (q) => q('select * from public.feed_posts where id=$1', [postA]))).toHaveLength(0);
    // penulis tetap melihat kontennya sendiri
    expect(await asUser(db, b, (q) => q('select * from public.feed_posts where id=$1', [post]))).toHaveLength(1);
  });

  it('laporan dapat dibuat tetapi tidak dapat dibaca pengguna', async () => {
    const a = await newUser(db);
    await asUser(db, a, (q) => q(`insert into public.reports(target_type, target_id, reason) values ('post', gen_random_uuid(), 'spam')`));
    await expectDenied(asUser(db, a, (q) => q('select * from public.reports')));
  });
});

describe('tantangan & pengingat', () => {
  it('kontribusi dibatasi 100/hari & progres tersedia untuk anggota saja', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const x = await newUser(db);
    const cid = await circleWith(a, [b]);
    const ch = (await asUser(db, a, (q) => q<{ id: string }>(
      `insert into public.circle_challenges(circle_id,title,target,starts_on,ends_on) values ($1,'Sedekah 1000',1000,current_date - 1,current_date + 30) returning id`, [cid])))[0]!.id;
    await expectDenied(asUser(db, b, (q) => q(`insert into public.circle_challenges(circle_id,title,target,starts_on,ends_on) values ($1,'x',1,current_date,current_date)`, [cid])));
    await asUser(db, b, (q) => q('select public.contribute_challenge($1, 60)', [ch]));
    await expectDenied(asUser(db, b, (q) => q('select public.contribute_challenge($1, 60)', [ch])));
    await expectDenied(asUser(db, x, (q) => q('select public.contribute_challenge($1, 1)', [ch])));
    const prog = await asUser(db, a, (q) => q<{ total: string; contributors: string; target: number }>('select * from public.challenge_progress($1)', [ch]));
    expect(Number(prog[0]!.total)).toBe(60);
    await expectDenied(asUser(db, x, (q) => q('select * from public.challenge_progress($1)', [ch])));
    await expectDenied(asUser(db, b, (q) => q(`insert into public.challenge_contributions(challenge_id,user_id,amount,day) values ($1,$2,100,current_date)`, [ch, b])));
  });

  it('nudges: batas 3/hari per pasangan, hanya sesama anggota, tidak bisa ke yang memblokir', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const x = await newUser(db);
    const cid = await circleWith(a, [b]);
    for (let i = 0; i < 3; i++) await asUser(db, a, (q) => q('select public.send_nudge($1,$2,$3)', [cid, b, 'ingat']));
    await expectDenied(asUser(db, a, (q) => q('select public.send_nudge($1,$2,$3)', [cid, b, 'doa'])));
    await expectDenied(asUser(db, a, (q) => q('select public.send_nudge($1,$2,$3)', [cid, x, 'ingat'])));
    await expectDenied(asUser(db, a, (q) => q('select public.send_nudge($1,$2,$3)', [cid, a, 'ingat'])));
    expect(await asUser(db, b, (q) => q('select * from public.nudges'))).toHaveLength(3);
    expect(await asUser(db, x, (q) => q('select * from public.nudges'))).toHaveLength(0);
    const y = await newUser(db);
    const cid2 = await circleWith(a, [y]);
    await asUser(db, y, (q) => q('insert into public.blocks(blocked) values ($1)', [a]));
    await expectDenied(asUser(db, a, (q) => q('select public.send_nudge($1,$2,$3)', [cid2, y, 'ingat'])));
  });
});

describe('hapus akun', () => {
  it('seluruh data pengguna terhapus (cascade), data orang lain utuh', async () => {
    const a = await newUser(db);
    const b = await newUser(db);
    const cid = await circleWith(a, [b]);
    const d = deedRow({ visibility: 'circle', circle_id: cid });
    await asUser(db, b, (q) => q('select public.push_deeds($1::jsonb)', [JSON.stringify([d])]));
    await asUser(db, b, (q) => q(`select public.push_private_items($1::jsonb)`, [JSON.stringify([{ id: 'p', kind: 'deed', ciphertext: 'c', nonce: 'n', rev: 1, updated_at: new Date().toISOString(), deleted_at: null }])]));
    await asUser(db, b, (q) => q(`insert into public.key_envelopes(envelope) values ('{}')`));
    await asUser(db, b, (q) => q('select public.delete_my_account()'));
    for (const t of ['deeds', 'private_items', 'key_envelopes', 'profiles', 'circle_members']) {
      const col = t === 'profiles' ? 'id' : 'user_id';
      expect((await db.query(`select 1 from public.${t} where ${col} = $1`, [b])).rows).toHaveLength(0);
    }
    expect((await db.query('select 1 from public.profiles where id = $1', [a])).rows).toHaveLength(1);
  });
});
