"""サンプル構成（personas.py）から本番に流す SQL を作る。

使い方: python3 -I scripts/samples/to_sql.py
  -> supabase/seed/sample_stacks.sql（追加。何度流しても同じ結果）
  -> supabase/seed/sample_stacks_remove.sql（実際の構成が集まったら流して全部消す）
サンプルのアカウントはメールもパスワードも持たないので、ログインできない。
catalog.sql を先に流しておくこと。
"""
import json
import os
import sys
import uuid

here = os.path.dirname(__file__)
sys.path.insert(0, here)
from personas import P  # noqa: E402

catalog = json.load(open(os.path.join(here, "../../supabase/seed/catalog.json"), encoding="utf-8"))
by_slug = {s["slug"]: s for s in catalog["services"]}
NS = uuid.UUID("5a3b1e00-0000-4000-8000-000000000000")


def q(v):
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def plan_of(slug, name):
    s = by_slug.get(slug)
    if s is None:
        sys.exit(f"unknown service: {slug}")
    if name is None:
        return s, None
    cycle = "yearly" if name.endswith("@y") else "monthly"
    name = name.removesuffix("@y")
    exact = [p for p in s["plans"] if p["name"] == name]
    # 名前が一致しなければ前方一致（「Pro」→「Pro（〜）」など）。同じ名前なら請求周期で選ぶ
    hits = exact or [p for p in s["plans"] if p["name"].startswith(name)]
    hits = [p for p in hits if p["billing_cycle"] == cycle] or hits
    if hits:
        return s, hits[0]
    sys.exit(f"unknown plan: {slug} / {name} (have {[p['name'] for p in s['plans']]})")


def monthly(p):
    return round(p["price_jpy"] / 12) if p["billing_cycle"] == "yearly" else p["price_jpy"]


assert len(P) == 30, len(P)
assert len({p["handle"] for p in P}) == 30
lines = ["-- 運営が作成したサンプル構成（30件）。scripts/samples/to_sql.py で生成。", "begin;", ""]
tags = sorted({t for p in P for t in p["tags"]} | {t for p in P for a in p["active"] for t in a[4]})
lines.append("insert into tags (name) values " + ", ".join(f"({q(t)})" for t in tags) + " on conflict (name) do nothing;")
lines.append("")
skipped = []
for i, p in enumerate(P):
    uid = str(uuid.uuid5(NS, p["handle"]))
    updated = f"2026-10-{(i % 7) + 1:02d}T09:00:00+09"
    lines += [
        f"-- {p['handle']}",
        f"insert into auth.users (id, instance_id, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ({q(uid)}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '{{\"sample\": true}}', '{{}}', now(), now()) on conflict (id) do nothing;",
        f"insert into profiles (id, handle, display_name, occupation, age_range, bio, visibility, is_sample, updated_at) values ({q(uid)}, {q(p['handle'])}, {q('サンプル（' + p['occupation'] + '）')}, {q(p['occupation'])}, {q(p['age'])}, {q(p['bio'])}, 'public', true, {q(updated)})",
        "  on conflict (id) do update set handle = excluded.handle, display_name = excluded.display_name, occupation = excluded.occupation, age_range = excluded.age_range, bio = excluded.bio, is_sample = true;",
        f"delete from user_tags where user_id = {q(uid)};",
        f"insert into user_tags (user_id, tag_id) select {q(uid)}, id from tags where name in ({', '.join(q(t) for t in p['tags'])});",
        f"delete from user_subscriptions where user_id = {q(uid)};",
    ]
    for j, (slug, pname, sat, comment, stags, started) in enumerate(p["active"]):
        s, pl = plan_of(slug, pname)
        if pl is None and s["plans"]:
            pl = s["plans"][0]
        if pl is None:  # 料金が確認できていないサービスは入れない
            skipped.append(f"{p['handle']}:{slug}")
            continue
        sid = str(uuid.uuid5(NS, f"{p['handle']}/{slug}"))
        lines.append(
            f"insert into user_subscriptions (id, user_id, service_id, plan_id, monthly_price, satisfaction, comment, started_on, status, sort_order) "
            f"select {q(sid)}, {q(uid)}, s.id, p.id, {monthly(pl)}, {sat}, {q(comment)}, {q(started + '-01')}, 'active', {j} "
            f"from services s join plans p on p.service_id = s.id where s.slug = {q(slug)} and p.name = {q(pl['name'])} and p.billing_cycle = {q(pl['billing_cycle'])};"
        )
        lines.append(f"insert into user_subscription_tags (user_subscription_id, tag_id) select {q(sid)}, id from tags where name in ({', '.join(q(t) for t in stags)}) and exists (select 1 from user_subscriptions where id = {q(sid)});")
    for j, (slug, pname, on, reason, detail, to) in enumerate(p["cancelled"]):
        s, pl = plan_of(slug, pname)
        if pl is None:
            skipped.append(f"{p['handle']}:{slug}(cancelled)")
            continue
        sid = str(uuid.uuid5(NS, f"{p['handle']}/{slug}/cancelled"))
        to_sql = f"(select id from services where slug = {q(to)})" if to else "null"
        lines.append(
            f"insert into user_subscriptions (id, user_id, service_id, plan_id, monthly_price, status, cancelled_on, cancel_reason, cancel_reason_detail, switched_to_service_id, sort_order) "
            f"select {q(sid)}, {q(uid)}, s.id, p.id, {monthly(pl)}, 'cancelled', {q(on + '-01')}, {q(reason)}, {q(detail)}, {to_sql}, {100 + j} "
            f"from services s join plans p on p.service_id = s.id where s.slug = {q(slug)} and p.name = {q(pl['name'])} and p.billing_cycle = {q(pl['billing_cycle'])};"
        )
    lines.append("")
lines.append("commit;")
open(os.path.join(here, "../../supabase/seed/sample_stacks.sql"), "w", encoding="utf-8").write("\n".join(lines) + "\n")

ids = ", ".join(q(str(uuid.uuid5(NS, p["handle"]))) for p in P)
open(os.path.join(here, "../../supabase/seed/sample_stacks_remove.sql"), "w", encoding="utf-8").write(
    "-- サンプル構成をすべて消す（契約・タグ・いいねは profiles の削除で一緒に消える）\n"
    "begin;\n"
    f"delete from profiles where is_sample and id in ({ids});\n"
    f"delete from auth.users where id in ({ids});\n"
    "commit;\n"
)
print("written; skipped (no verified price yet):", skipped)
